# 오픈소스 라이선스 고지 (Third-Party Notices)

## 사이트에 함께 배포되는 것

아래 코드는 빌드 결과(`dist/assets`)에 들어가 사이트와 함께 배포됩니다. 각 저작권 표시와 라이선스 전문은 빌드할 때 `dist/third-party-licenses.txt`로 만들어지고, 운영 사이트의 `/third-party-licenses.txt`에서 볼 수 있습니다(이용약관에서 링크). 만드는 코드는 `scripts/pages/licenses.ts`이며, 원문이 없거나 PDF.js 버전이 기록과 다르면 빌드가 실패합니다.

| 패키지 | 용도 | 라이선스 | 원문 |
|---|---|---|---|
| react, react-dom | 화면 구성 | MIT | `node_modules/<패키지>/LICENSE` |
| scheduler (react-dom에 포함되어 번들됨) | 화면 구성 | MIT | `node_modules/scheduler/LICENSE` |
| lucide-react | 아이콘 | ISC (일부 아이콘은 Feather 파생, MIT — 같은 LICENSE 파일에 함께 있음) | `node_modules/lucide-react/LICENSE` |
| unpdf | PDF 읽기 | MIT | `node_modules/unpdf/LICENSE` |
| PDF.js (unpdf에 들어 있는 빌드) | PDF 해석·그리기 | Apache-2.0 | unpdf 패키지에는 없으므로 상류 원문을 `scripts/pages/licenses/pdf.js-LICENSE`에 그대로 보관 |
| tailwindcss | 스타일 (기본 스타일이 생성 CSS에 들어감) | MIT | `node_modules/tailwindcss/LICENSE` |

PDF.js 원문은 unpdf에 들어 있는 버전과 같은 상류 태그의 파일입니다. unpdf나 lockfile을 올려 PDF.js 버전이 바뀌면, 새 버전의 상류 LICENSE를 확인해 `scripts/pages/licenses/`와 `licenses.ts`의 기록을 함께 고쳐야 빌드가 통과합니다.

## 개발에만 쓰는 것 (배포물에 들어가지 않음)

vite, @vitejs/plugin-react, @tailwindcss/vite (MIT), typescript (Apache-2.0), @types/* (MIT). 빌드 도구라 사이트 코드에 포함되지 않습니다.

## 예제 회로도 (Example schematic)

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `public/examples/olimex-esp32-poe-rev-i.pdf` | Olimex Ltd., ESP32-PoE Rev. I 회로도 — https://github.com/OLIMEX/ESP32-POE | Apache-2.0 (상류 저장소의 하드웨어 라이선스) |

원본을 수정하지 않고 그대로 제공합니다. `public/examples/LICENSE-olimex-esp32-poe.txt`는 상류 저장소의 `LICENSE`와 같은 파일입니다. `public/examples/NOTICE-olimex-esp32-poe.txt`는 이 사이트가 쓴 출처·무수정 안내이며, 상류 저장소에는 별도의 NOTICE 파일이 없습니다. Olimex는 이 사이트와 관계가 없습니다.
