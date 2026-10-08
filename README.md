# 회로도 노드 탐색기 (Schematic Net Explorer)

회로도 PDF를 올리면 도면을 그래픽으로 표시하고, 배선을 클릭하면 **같은 노드 전체를 빨간색으로 강조**하는 웹 도구입니다.
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
| `npm run analyze -- <파일.pdf> [노드이름]` | 브라우저 없이 분석 결과 점검 (아래 5장) |

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

## 3. 폴더 구조

```
schematic-explorer/
├─ index.html                     페이지 틀
├─ vite.config.ts                 빌드 설정
├─ Dockerfile, nginx.conf         컨테이너 배포용
├─ PROJECT_SUMMARY.md             기획·진행 경과 정리
├─ THIRD_PARTY_NOTICES.md         오픈소스 라이선스 고지
├─ scripts/
│  └─ analyze-cli.ts              분석 결과 점검 도구 (브라우저 없이 실행)
└─ src/
   ├─ main.tsx                    진입점
   ├─ App.tsx                     화면 전체: 상태(선택/검색/페이지)와 레이아웃
   ├─ index.css                   색상·테마 토큰 (여기만 고치면 색 변경)
   ├─ components/
   │  ├─ viewer.tsx               도면 표시, 확대/이동, 클릭, 빨간 강조
   │  ├─ sidebar.tsx              왼쪽 노드/부품 목록과 검색창
   │  ├─ upload-hero.tsx          첫 화면 (파일 선택·끌어놓기)
   │  └─ ui.tsx                   버튼·입력창·탭 등 기본 부품
   └─ lib/schematic/
      ├─ extract.ts               ① PDF → 선/글자 원본 데이터 추출
      ├─ analyze.ts               ② 원본 데이터 → 배선·노드·부품 분석 (핵심 로직)
      └─ model.ts                 ③ 목록 정리, 클릭 위치 찾기, 검색
```

## 4. 동작 원리

PDF에는 "어디가 어디와 연결됐는지" 정보가 없고 **선과 글자만** 있습니다. 그래서 그림을 해석해서 연결을 추정합니다.

```
PDF ─► extract.ts ─► analyze.ts ─────────────────────────────► model.ts ─► 화면
       선 경로·글자     1) 글자 분류 (부품/값/핀번호/노드라벨/메모)
       위치 추출        2) 글자 모양 선(벡터 글꼴) 걸러내기
                        3) 배선 후보 = 수평·수직 직선
                        4) 배선끼리 연결 (끝점이 만나거나, T자 + 접점 점)
                        5) 다이오드 삼각형을 관통하는 선은 끊기
                        6) 라벨을 가장 가까운 배선(또는 포트 화살표)에 붙임
                        7) 같은 이름의 포트 라벨·전원(+3.3V 등)은 같은 노드로 합침
```

### 판단 규칙과 조정 위치 (`src/lib/schematic/analyze.ts`)

| 규칙 | 현재 값 / 방식 | 고칠 곳 (검색어) |
|---|---|---|
| 부품 이름 인식 | 표준형 `R1`, `C12`, `U3`, `IC5` (정해진 접두어 + 숫자) / 접미형 `R47Q`, `C88W` (영문 + 숫자 2~3자 + 영문 1~2자) / `*`로 시작 / `CN_…` | `REFDES`, `CONNECTOR_REF`, `classifyText` |
| 값 인식 | `10uF`, `4.7K`, `100ohm`, `25V`, `1%` 등 | `VALUE`, `PART` |
| 전원 노드 | `+3.3V`, `+5V`, `-15V`, `GND…`, `VCC…`, `VDD…` | `POWER` |
| 배선 끝점이 같다고 보는 거리 | 0.08pt | `const EPS` |
| 접점 점 크기 | 지름 0.8~3.2pt 채워진 원 | `junction dot` 주석 부분 |
| 라벨 ↔ 배선 최대 거리 | 글자 높이 × 0.9 | `t.size * 0.9` |
| 포트 화살표·전원 기호 탐색 범위 | 글자 높이 × 1.6 | `const g = t.size * 1.6` |
| IC 몸체 판단 (안의 글자 = 핀 이름) | 닫힌 사각형, 면적 120pt² 초과 | `isBig` |
| 손으로 그린 표시(굵은 펜) 무시 | 두께 0.45pt 초과한 곡선 채움 | `thick > 0.45` |

**규칙을 바꾸면 반드시 5장의 점검 도구로 전후 결과를 비교하세요.** 한 도면에서 좋아져도 다른 도면에서 나빠질 수 있습니다.

## 5. 분석 결과 점검 (유지보수 핵심)

```bash
npm run analyze -- ./samples/회로도.pdf +5V
```

출력 내용:
- 페이지별 배선·노드·접점 개수, 글자 분류 통계
- **연결되지 않은 라벨** 목록 → 라벨이 배선에 안 붙은 경우 (거리 기준이 너무 좁음)
- **큰 노드 상위 8개**와 그 라벨 → 서로 다른 라벨이 한 노드에 섞여 있으면 잘못 합쳐진 것
- 지정한 노드(예: `+5V`)에 붙은 라벨과 좌표
- `회로도.analysis.json` 파일로 노드·부품 목록 저장

권장 절차:
1. 점검용 회로도 PDF를 `samples/` 폴더에 모아 둡니다. **공개 회로도(오픈소스 하드웨어, 데이터시트 예제 등)나 직접 그린 회로도만 사용하세요.** `samples/`, `*.pdf`, `*.analysis.json`은 `.gitignore`에 등록되어 저장소에 올라가지 않습니다.
2. 규칙 수정 전후로 `npm run analyze`를 돌려 "연결되지 않은 라벨 수"와 "큰 노드의 라벨 구성"을 비교합니다.
3. 의심 부분은 `npm run dev`로 띄워 도면에서 직접 클릭해 확인합니다.

## 6. 자주 하는 수정

| 하고 싶은 것 | 방법 |
|---|---|
| 강조 색 바꾸기 | `components/viewer.tsx`에서 `text-red-600` → 원하는 색 |
| 화면 테마 색 바꾸기 | `src/index.css`의 `--primary` 등 토큰 |
| 새 부품 접두어 추가 (예: `PS1`) | `analyze.ts`의 `REFDES` 정규식의 접두어 목록에 추가 |
| 전원 이름 추가 (예: `VBUS`) | `analyze.ts`의 `POWER` 정규식에 추가 |
| 다른 CAD(Altium, KiCad 등)에서 뽑은 PDF 지원 | 해당 PDF로 `npm run analyze` → 글자가 실제 텍스트인지(`글자 벡터 여부`), 접점 점 크기, 포트 기호 모양을 확인하고 표 4장의 값 조정 |
| 클릭 허용 범위 조정 | `components/viewer.tsx`의 `5 * v.k` (화면 5픽셀) |

## 7. 알려진 한계

- 연결은 **그림 모양으로 추정**합니다. IC 내부 핀 이름(`OUT`, `VCC`, `GND`)이 옆 노드 라벨로 붙거나, 일부 같은 이름 라벨이 합쳐지지 않을 수 있습니다. 검색(노란 표시)은 글자 기준이라 이 영향을 받지 않습니다.
- 스캔한(이미지) PDF는 선 정보가 없어 지원하지 않습니다.
- 여러 장짜리 도면은 페이지별로 분석하며, 페이지 사이 연결은 같은 이름으로만 목록에서 묶어 보여 줍니다.

## 8. 다음에 추가하면 좋은 기능

- 노드별로 연결된 부품·핀 번호 목록
- 여러 페이지 사이 같은 노드 따라가기 (오프페이지 커넥터)
- 노드·부품 목록 Excel 내보내기
- 분석이 오래 걸리는 큰 도면을 위해 Web Worker로 분석 이동 (`extract.ts`의 `analyzePage` 호출부)
