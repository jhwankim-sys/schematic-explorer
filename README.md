# 회로도 노드 탐색기 (Schematic Net Explorer)

회로도 PDF를 올리면 도면을 그래픽으로 표시하고, 배선을 클릭하면 **같은 노드 전체를 청록색으로 강조**하는 웹 도구입니다.
PDF에서 Ctrl+F로 핀 이름이나 `+5V` 같은 노드를 하나씩 찾던 불편을 줄이려고 만들었습니다.

- 서버가 필요 없는 **정적 웹페이지**입니다. PDF는 사용자의 브라우저 안에서만 분석되고 어디에도 업로드되지 않습니다.
- 기술 스택: React 19 + TypeScript + Vite 7 + Tailwind CSS 4, PDF 해석은 `unpdf`(pdf.js 포함)

---

## 1. 실행 방법

필요: **Node.js 22.6 이상** (분석 점검 도구가 TypeScript를 바로 실행하는 기능을 씁니다)

```bash
npm install        # 최초 1회
npm run dev        # 개발 서버 → 브라우저에서 http://localhost:5173
```

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 (코드 저장 시 자동 새로고침) |
| `npm run build` | 타입 검사 + 배포용 빌드 → `dist/` 폴더 생성 |
| `npm run preview` | 빌드 결과를 로컬에서 확인 |
| `npm run typecheck` | 타입 검사만 |
| `npm run analyze -- <파일.pdf> [노드이름] [--svg]` | 브라우저 없이 분석 결과 점검 (아래 5장) |
| `npm run corpus:fetch` | 정답 비교용 공개 회로도 내려받기 (git 필요, 6장) |
| `npm run corpus:score` | 모든 회로도를 분석해 정답과 비교한 점수표 출력 (6장) |

## 2. 배포 방법

`npm run build` 결과물인 `dist/` 폴더는 HTML·JS·CSS 파일뿐이라 **어떤 웹서버에도 그대로 올리면 됩니다.**
`vite.config.ts`에 `base: "./"`가 설정되어 있어 하위 경로(예: `/tools/schematic/`)에 올려도 동작합니다.

| 방식 | 방법 |
|---|---|
| GitHub Pages (기본) | `main`에 push하면 `.github/workflows/deploy.yml`이 자동 빌드·배포. 최초 1회 저장소 Settings → Pages → Source를 **GitHub Actions**로 지정 |
| 일반 웹서버 / VPS (nginx, Apache) | `dist/` 안의 파일을 웹 루트나 하위 폴더에 복사 |
| Docker | `docker build -t schematic-explorer .` → `docker run -p 8080:80 schematic-explorer` (포함된 `Dockerfile`, `nginx.conf` 사용) |
| 정적 호스팅 (Cloudflare Pages, Netlify, Vercel, GitHub Pages, Azure Static Web Apps 등) | 빌드 명령 `npm run build`, 결과 폴더 `dist` 로 지정 |

> pdf.js 파일이 약 1.7MB(압축 시 약 0.5MB)라 첫 로딩만 조금 걸리고, 이후에는 브라우저 캐시를 씁니다.

### 외부 웹사이트로 운영할 때 권장 사항

- **HTTPS 필수**: 대부분의 정적 호스팅은 무료 인증서를 자동 제공합니다.
- **보안 헤더**: 외부 스크립트를 쓰지 않으므로 아래처럼 엄격하게 설정할 수 있습니다 (nginx 예시).
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy no-referrer;
  ```
  헤더를 추가한 뒤에는 PDF 열기가 정상 동작하는지 꼭 확인하세요.
- **개인정보·업로드 정책**: 이 도구는 파일을 서버로 보내지 않습니다. 사이트에 "업로드한 PDF는 브라우저 안에서만 처리되며 저장·전송되지 않습니다" 같은 안내 문구를 넣으면 사용자 신뢰에 도움이 됩니다. 나중에 서버 저장 기능을 추가한다면 개인정보처리방침이 필요합니다.
- **접속 분석 도구(Google Analytics 등)를 붙일 경우** 파일 이름이나 노드 이름이 이벤트로 전송되지 않도록 주의하세요.
- **오픈소스 고지**: 사용한 라이브러리의 라이선스는 `THIRD_PARTY_NOTICES.md` 참고.
- **CSP와 광고·통계**: GA4나 AdSense를 켜면 Google 도메인 스크립트가 필요하므로 위 CSP를 그대로 쓰면 막힙니다. 해당 도메인을 허용하도록 고쳐 주세요.

### 사이트 설정과 콘텐츠 페이지 (`site.config.json`, `scripts/pages/`)

`npm run build`는 도구(vite) 빌드 뒤에 `node scripts/pages/build.ts`로 정적 글 페이지를 만듭니다.

- 글: `scripts/pages/content/*.ts` (한국어 `/guide/`, 영어 `/en/guide/`). 사용법·지원 형식·예제·부품 찾기·회로도 읽기·FAQ·소개·문의·개인정보처리방침·이용약관.
- 함께 만들어지는 것: `sitemap.xml`, `robots.txt`, 각 페이지의 canonical·hreflang.
- `site.config.json` 값을 채우고 다시 배포하면 자동 반영됩니다. 비어 있으면 아무것도 넣지 않습니다.

| 키 | 내용 |
|---|---|
| `contactEmail` | 문의 페이지·개인정보처리방침에 표시할 이메일 |
| `ga4MeasurementId` | GA4 측정 ID (`G-XXXXXXXXXX`). 넣으면 통계와 이벤트(file_open, example_load, view_complete, error)가 켜지고 개인정보처리방침 문구가 함께 바뀝니다 |
| `googleSiteVerification` | Search Console HTML 태그 방식의 `content` 값 |
| `naverSiteVerification` | 네이버 서치어드바이저 HTML 태그 방식의 `content` 값 |

도구 동작이 바뀌면 글 내용(특히 개인정보처리방침·파일 처리 정책·예제 숫자)도 함께 고쳐 주세요.

## 3. 폴더 구조

```
schematic-explorer/
├─ index.html                     페이지 틀
├─ vite.config.ts                 빌드 설정
├─ Dockerfile, nginx.conf         컨테이너 배포용
├─ PROJECT_SUMMARY.md             기획·진행 경과 정리
├─ THIRD_PARTY_NOTICES.md         오픈소스 라이선스 고지
├─ corpus/
│  └─ manifest.json               정답 비교용 공개 회로도 목록 (파일은 내려받아 씀)
├─ scripts/
│  ├─ analyze-cli.ts              분석 결과 점검 도구 (브라우저 없이 실행)
│  └─ corpus/                     코퍼스 채점 도구
│     ├─ fetch.ts                 목록의 PDF·CAD 원본 내려받기
│     ├─ groundtruth.ts           CAD 원본(KiCad 5/6+, Eagle)에서 정답 넷 뽑기
│     ├─ align.ts                 CAD 좌표 ↔ PDF 좌표 맞추기
│     ├─ metrics.ts               점수 계산 (배선·묶음·이름·부품)
│     ├─ score.ts                 채점 실행, 점수표 출력
│     ├─ styles.ts                선 스타일(색·굵기)별 배선 일치 통계
│     └─ svg.ts                   분석 결과 겹쳐 그리기 (디버깅용)
└─ src/
   ├─ main.tsx                    진입점
   ├─ App.tsx                     화면 전체: 상태(선택/검색/페이지)와 레이아웃
   ├─ index.css                   색상·테마 토큰 (여기만 고치면 색 변경)
   ├─ components/
   │  ├─ viewer.tsx               도면 표시, 확대/이동, 클릭, 노드 강조
   │  ├─ sidebar.tsx              왼쪽 노드/부품 목록과 검색창
   │  ├─ upload-hero.tsx          첫 화면 (파일 선택·끌어놓기)
   │  └─ ui.tsx                   버튼·입력창·탭 등 기본 부품
   └─ lib/schematic/
      ├─ extract.ts               ① PDF → 선(색·굵기 포함)/글자 원본 데이터 추출
      ├─ analyze.ts               ② 원본 데이터 → 배선·노드·부품 분석 (핵심 로직)
      ├─ cad-hints.ts             ②' CAD가 PDF에 남긴 힌트 읽기 (Altium 책갈피 넷리스트·핀 표식)
      └─ model.ts                 ③ 목록 정리, 클릭 위치 찾기, 검색
```

## 4. 동작 원리

PDF에는 "어디가 어디와 연결됐는지" 정보가 없고 **선과 글자만** 있습니다. 그래서 그림을 해석해서 연결을 추정합니다.
화면에는 PDF를 pdf.js로 **그대로 그리고**, 그 위에 분석 결과(노드 강조, 검색 표시)만 겹쳐 그립니다.

```
PDF ─► extract.ts ─► analyze.ts ───────────────────────────────────────► model.ts ─► 화면
       선 경로(색·굵기)  0) 기준 크기 S = 도면 글자 높이의 중앙값 (모든 거리 기준은 S 배수)
       글자 위치         1) 글자 분류 (부품/값/핀번호/노드라벨/메모)
                        2) 글자 모양 선(벡터 글꼴) 걸러내기: 글자 상자 안의 짧은 선, 글자 전용 스타일
                        3) 배선 색 찾기: 색·굵기별로 묶어, 길고 접점(점)과 같은 색인 스타일 = 배선
                           (KiCad 초록, Altium 남색, Eagle 초록 등). 색 구분이 없으면 흑백 규칙 사용
                        4) 배선끼리 연결: 끝점 일치, T자는 접점(점)이 있을 때만
                        5) 흑백 도면: 글자 든 사각형·작은 사각형은 부품 몸체, 이름도 점도 없는 작은
                           선 조각은 글자 획으로 보고 제외, 다이오드 삼각형 관통선 분리
                        6) 라벨 연결: 라벨 밑줄(기준선) 바로 아래를 지나는 배선 / 플래그 테두리 /
                           전원 기호를 사이에 둔 배선 끝 — 순서로 시도. 핀 선 위에 쓴 이름은 핀 이름
                        7) 접지 기호(점점 짧아지는 가로줄)는 이름이 없어도 GND로 묶음
                        8) 같은 이름의 라벨·전원은 같은 노드로 합침
                        9) Altium Smart PDF: 책갈피 넷리스트 + 핀 표식으로 연결을 정확히 보정
                       10) 흑백 도면의 포트(off-page/goto) 기호: 화살촉 + 평행한 두 변 + 뒷변 모양을
                           찾아 배선에서 빼고 라벨 연결용 기호로만 사용 (붙어 있는 포트가 핀을 합치던 문제)
                       11) OrCAD Capture PDF: 링크 주석(파란 상자=넷 라벨, 노란 상자=부품)으로 라벨·부품
                           참조·값을 정확히 구분, 부품 상자 안 글자는 핀 이름으로 처리. 링크 스크립트의
                           Ref-Des·Value로 글자가 선으로 그려진 도면에서도 부품 목록·검색 제공
                       12) 글자 펜 구분(글자를 선으로 그린 컬러 도면, 예: KiCad): 글자마다 그린 펜 색을
                           읽고, 확실한 글자(배선 위 라벨·부품 번호·문장·핀 번호)로 "라벨 펜 / 부품 글자 펜 /
                           메모 펜 / 핀 번호 펜"을 가려냄. 메모 펜으로 쓴 제목("Battery Measurement")이
                           배선에 걸쳐 있어도 노드가 아니고, 부품 글자 펜의 핀 이름("CC")은 전원 기호를
                           통해서만 노드 이름이 되며, 핀 번호 펜의 "CD1"은 부품이 아님
                       13) 부품 값 짝짓기: 참조 번호마다 가장 가까운 값을 주되 값 하나는 한 부품에만.
                           후보가 얽힌 묶음은 전체 거리가 가장 짧게 한꺼번에 배정(촘촘한 콘덴서 줄에서
                           옆 부품 값으로 한 칸씩 밀리는 문제 방지). 같은 줄에서 기호를 사이에 둔 짝,
                           같은 종류 부품에서 반복되는 배치, 같은 기호에 붙어 있는 짝을 우선
```

### 판단 규칙과 조정 위치 (`src/lib/schematic/analyze.ts`)

| 규칙 | 현재 값 / 방식 | 고칠 곳 (검색어) |
|---|---|---|
| 기준 크기 S | 글자(2자 이상) 높이 중앙값, 1.2~40pt로 제한 | `const S =` |
| 부품 이름 인식 | 표준형 `R1`, `C12`, `U3`, `U4A` (정해진 접두어 + 숫자 + 게이트 문자) / 접미형 `R47Q`, `C88W` / `*`로 시작 / `CN_…` / 값 글자 옆의 서술형 `PWRLED1` | `STD_PREFIX`, `REFDES`, `LOOSE_REF` |
| 값 인식 | `10uF`, `4.7K`, `100nF/50V`, `1N5819(SOD-123)` 등 | `VALUE`, `PART`, `PART_PAREN` |
| 신호 이름(값으로 오인 방지) | `GPIO19`, `PA10`, `ADC3` … | `SIGNAL` |
| 전원 노드 | `+3.3V`, `5V`, `GND…`, `VCC…`, `VDD…`, `VBUS…` (단 `16V`처럼 부호 없는 전압은 전원 기호를 통해서만 연결) | `POWER`, `bareVolt` |
| 배선 색 판정 | 색·굵기 스타일별 길이·평균 길이·닫힌 도형 비율·접점 색 일치로 점수 | `which stroke style is the wiring` |
| 끝점이 같다고 보는 거리 | 선 굵기의 0.6배, S의 3% 중 큰 값 | `const EPS` |
| 접점 점 크기 | 지름 S의 0.12~1.3배, 둥근 채움 | `junction dots` |
| 라벨 ↔ 배선 | 기준선에서 −0.6S ~ +0.3S 사이를 나란히 지나고, 라벨 시작·끝 아래까지 오는 배선 | `alongSeg` |
| 핀 이름 판정 | 글자 길이의 50% 이상 아래로 핀(심볼 색) 선이 지나감 | `pinUnder` |
| 전원 기호 탐색 범위 | 글자 높이 × 1.6 | `const g = t.size * 1.6` |
| IC 몸체 (안의 글자 = 핀 이름) | 닫힌 사각형(컬러 도면은 선 4개로 그린 사각형 포함), 면적 > 6S², 안에 배선이 없음 | `isBig`, `wiresInside`, `four separate symbol lines` |
| 제목(메모) 판정 | 기준 크기의 1.5배 이상 글자가 두 줄 이상 나란히 쌓임 / 메모 펜으로 쓴 글자 | `headings set in large lettering`, `notePens` |
| 글자 펜 구분 | 라벨 펜: 배선 위 라벨 4개 이상·부품 번호 거의 없음 / 부품 글자 펜: 부품 번호 6개 이상 / 핀 번호 펜: 숫자가 절반 이상 / 메모 펜: 문장이 라벨의 2배 이상 | `lettering pens` |
| 글자 획 제외 | 글자 상자 안의 짧은 선. 단, 글자와 펜 색이 다른 선·기준선 아래로 글자보다 길게 지나는 직선(핀 선)은 글자가 아님 | `insideText` |
| 부품 번호 방식 | 한 장에서 소수(1/12 이하)인 방식의 번호(`DW02R`)는 부품 번호가 아니라 값 | `numbers its parts in one style` |
| 부품 값 짝짓기 | 참조 번호와의 간격 6S 이내(3.2S 넘으면 위·아래·옆으로 정렬된 것만), 값 없음 비용 9S | `settled together`, `alone` |

**규칙을 바꾸면 반드시 6장의 코퍼스 채점으로 전후 점수를 비교하세요.** 한 도면에서 좋아져도 다른 도면에서 나빠질 수 있습니다.

## 5. 분석 결과 점검 (한 장씩)

```bash
npm run analyze -- ./samples/회로도.pdf +5V --svg
```

출력 내용:
- 페이지별 배선·노드·접점 개수, 글자 크기, **배선 구분 방식**(어떤 색을 배선으로 봤는지 / 흑백 규칙)
- **연결되지 않은 라벨** 목록 → 라벨이 배선에 안 붙은 경우
- **큰 노드 상위 8개**와 그 라벨 → 서로 다른 라벨이 한 노드에 섞여 있으면 잘못 합쳐진 것
- 지정한 노드(예: `+5V`)에 붙은 라벨과 좌표
- `--svg`: `회로도-p1.svg` 처럼 쪽마다 분석 결과를 겹쳐 그린 그림. 브라우저로 열어 확대하면 노드별 색과 글자 상자가 보이고, 마우스를 올리면 노드 번호·이름이 나옵니다.
- `회로도.analysis.json` 파일로 노드·부품 목록 저장

점검용 회로도 PDF는 `samples/` 폴더에 모아 둡니다. **공개 회로도나 직접 그린 회로도만 사용하세요.** `samples/`, `*.pdf`, `*.analysis.json`은 `.gitignore`에 등록되어 저장소에 올라가지 않습니다.

## 6. 코퍼스 채점 — 정답과 비교해서 규칙 다듬기

규칙 기반 엔진이라 "학습"은 **정답이 있는 회로도 모음(코퍼스)으로 점수를 매기고, 점수가 오르도록 규칙을 고치는** 방식으로 합니다.
정답은 PDF와 함께 공개된 **CAD 원본**에서 자동으로 뽑습니다.

| CAD | 정답 출처 | 비교 단위 |
|---|---|---|
| KiCad 5 (`.sch`), KiCad 6+ (`.kicad_sch`) | 원본의 배선·접점·라벨·전원 기호로 넷 계산 | 배선 선분 |
| Eagle (`.sch` XML) | 원본에 넷이 그대로 들어 있음 | 배선 선분 |
| Altium Smart PDF | **PDF 책갈피**에 넷리스트가 들어 있음 (원본 불필요) | 핀 |

```bash
npm run corpus:fetch                 # corpus/manifest.json 의 공개 회로도 내려받기 (최초 1회, git 필요)
npm run corpus:score                 # 전체 점수표
npm run corpus:score -- olimex --svg # 일부만 + 겹쳐 그리기(corpus/out/*.svg)
npm run corpus:score -- --mono       # 모든 선을 검은색으로 바꿔 채점 (흑백 인쇄 PDF 대비)
npm run corpus:score -- --no-hints   # Altium 책갈피 없이 순수 도면 해석만 채점
npm run corpus:styles                # 선 스타일별로 실제 배선과 얼마나 겹치는지 (규칙 근거 자료)
```

점수표 항목 (높을수록 좋음):

| 항목 | 뜻 | 낮으면 의심할 것 |
|---|---|---|
| 배선정밀 | 배선이라고 본 선 중 진짜 배선 비율 | 글자 획·부품 테두리를 배선으로 오인 |
| 배선재현 | 진짜 배선 중 찾아낸 비율 | 배선 색 판정 실패 |
| 묶음정밀 | 한 노드로 묶은 것이 실제로 같은 넷인 정도 | 다른 노드가 잘못 합쳐짐 (라벨 오연결) |
| 묶음재현 | 같은 넷이 한 노드로 묶인 정도 | 노드가 끊김 (접점·전원 기호·라벨 미연결) |
| 넷정확 | 넷이 정확히(95% 이상) 한 노드로 복원된 비율 | |
| 이름정확 | 이름이 보이는 넷의 노드 이름이 맞은 비율 | |
| 부품재현/정밀 | 부품 이름(R1 …) 인식 | |
| 값정확 | 찾은 부품 중 목록의 값이 원본의 값과 같은 비율 (KiCad 원본만) | 옆 부품 값과 뒤바뀜, 값이 멀리 떨어져 있음 |
| 가짜이름 | 원본의 어떤 라벨·전원 기호에도 없는 노드 이름 수 (**낮을수록 좋음**) | 제목·핀 이름·부품 값이 노드로 잡힘 |

`corpus/manifest.json`의 `olimex-esp32-poe-i`는 사이트 예제 회로도와 같은 파일입니다. 예제는 모든 항목이 100(가짜이름 0)이어야 합니다(배선정밀은 버스 진입선 때문에 98.1).

새 회로도를 추가하려면 `corpus/manifest.json`에 저장소·커밋·경로를 한 줄 추가하고 `npm run corpus:fetch`를 다시 실행합니다.
PR을 올리면 GitHub Actions가 같은 채점을 돌려 결과를 PR의 **Checks → 코퍼스 채점 → Summary**에 표로 남깁니다.

## 6. 자주 하는 수정

| 하고 싶은 것 | 방법 |
|---|---|
| 강조 색 바꾸기 | `components/viewer.tsx`에서 `text-red-600` → 원하는 색 |
| 화면 테마 색 바꾸기 | `src/index.css`의 `--primary` 등 토큰 |
| 새 부품 접두어 추가 (예: `PS1`) | `analyze.ts`의 `REFDES` 정규식의 접두어 목록에 추가 |
| 전원 이름 추가 (예: `VBUS`) | `analyze.ts`의 `POWER` 정규식에 추가 |
| 새 CAD 출력 지원 | 원본이 공개된 샘플을 `corpus/manifest.json`에 추가 → `npm run corpus:score -- <id> --svg`로 틀린 곳 확인 → 4장 규칙 조정 → 전체 점수가 떨어지지 않는지 확인 |
| 클릭 허용 범위 조정 | `components/viewer.tsx`의 `5 * v.k` (마우스 5픽셀, 터치 9픽셀) |

## 7. 알려진 한계

- 연결은 **그림 모양으로 추정**합니다 (Altium Smart PDF 제외). 핀 이름이 옆 노드 라벨로 붙거나, 일부 같은 이름 라벨이 합쳐지지 않을 수 있습니다. 검색(노란 표시)은 글자 기준이라 이 영향을 받지 않습니다.
- **글자를 선으로만 그리고 글자 정보를 넣지 않은 PDF**(예: 일부 Eagle·OrCAD 출력)는 라벨 글자를 읽을 수 없어 노드 이름이 비어 있습니다. 연결 강조는 동작하고, OrCAD 출력은 링크 주석으로 부품 목록·검색만 제공합니다.
- 흑백 인쇄 PDF는 배선과 부품 선을 색으로 구분할 수 없어, 핀·심볼의 짧은 선이 노드에 일부 포함될 수 있습니다.
- 스캔한(이미지) PDF는 선 정보가 없어 지원하지 않습니다.
- 여러 장짜리 도면은 페이지별로 분석하며, 페이지 사이 연결은 같은 이름으로만 목록에서 묶어 보여 줍니다.

## 8. 다음에 추가하면 좋은 기능

- 노드별로 연결된 부품·핀 번호 목록
- 여러 페이지 사이 같은 노드 따라가기 (오프페이지 커넥터)
- 노드·부품 목록 Excel 내보내기
- 분석이 오래 걸리는 큰 도면을 위해 Web Worker로 분석 이동 (`extract.ts`의 `analyzePage` 호출부)
- 선으로 그린 글자 읽기 (Eagle·KiCad 벡터 글꼴 모양 대조)
- 코퍼스 확대: Altium·OrCAD·Zuken 출력 PDF, KiCad 계층 시트
