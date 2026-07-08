# 🧵 타래 (Tarae)

> 머릿속에 떠오른 생각 조각(실마리)을 가볍게 던져 저장하고, 흩어진 조각들을 서로 엮어(베틀) 새로운 아이디어로 발전시키는 개인 생각 관리 웹 서비스

- **배포 URL**: https://think-tarae.vercel.app/
- **GitHub 저장소**: https://github.com/woniri/codyssey-A1-3

---

## 1. 서비스 소개

하루에도 여러 번 스쳐 지나가는 아이디어와 생각들은 대부분 기록되지 못한 채 사라집니다.
**타래**는 그런 생각의 파편을 "실마리"로 가볍게 던져 저장하고, 시간이 지나 다시 꺼내 보거나
서로 다른 생각을 이어 붙여(**베틀**) 새로운 기획으로 발전시킬 수 있도록 돕는 서비스입니다.

- 저장된 생각들은 **타래장**에서 네트워크 그래프 형태로 시각화되어, 태그와 흐름을 한눈에 볼 수 있습니다.
- 서로 다른 두 생각을 선택하면 AI가 둘을 조합해 새로운 아이디어 초안을 만들어주는 **실타래 연금술** 기능이 핵심 AI 기능입니다.
- **설정** 페이지에서 디스코드/슬랙 웹훅을 등록해두면 주간 리포트를 자동으로 받아볼 수 있습니다.

## 2. 페이지 구성

| 페이지 | 파일 | 설명 |
|---|---|---|
| 실마리 (홈) | `index.html` | 생각 입력, 오늘의 인사이트, 태그 클라우드, 실타래 상태 지표 |
| 베틀 | `loom.html` | 저장된 생각 하나를 골라 4가지 관점(전문가 패널)으로 확장해보는 작업대 |
| 타래장 | `vault.html` | 전체 생각/프로젝트를 그래프로 시각화, 두 생각을 조합하는 AI 기능(실타래 연금술) 제공 |
| 설정 | `settings.html` | 디스코드/슬랙 웹훅 등록 및 리포트 발송 주기 설정 |

네비게이션 바(모든 페이지 상단)를 통해 4개 페이지를 자유롭게 이동할 수 있고, 다크 모드를 지원합니다.

## 3. 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | 바닐라 HTML / CSS / JavaScript (프레임워크 미사용) |
| 시각화 | vis-network (타래장 그래프) |
| 백엔드 | Vercel Serverless Functions (Python) |
| 데이터베이스 · 인증 | Supabase (Postgres + Auth) |
| AI | Google Gemini API (`gemini-2.5-flash`, `google-generativeai` SDK) |
| 배포 | Vercel (GitHub 연동 자동 배포) |
| 알림 | Discord / Slack Webhook |

## 4. 폴더 구조

```
tarae/
├── index.html          # 실마리 (홈)
├── loom.html            # 베틀
├── vault.html           # 타래장
├── settings.html        # 설정
├── css/
│   ├── style.css
│   └── dark-mode.css
├── js/                   # 프론트엔드 로직
│   ├── app.js            # 다크모드 토글, 인증 세션 가드
│   ├── storage.js        # Supabase 클라이언트 초기화 및 CRUD 래퍼(TaraeStorage)
│   └── stream.js         # 홈 화면 생각 입력/저장 처리
├── api/                  # 백엔드 (Vercel Serverless Functions, Python)
│   ├── config.py          # 프론트에 Supabase 공개 키 전달
│   ├── classify.py        # 생각 문장 → 태그/공감 문장 생성 (Gemini)
│   ├── connect.py         # 두 생각 조각 → 새 기획안 생성 (Gemini)
│   ├── expand.py           # 아이디어 → 실행 할 일 목록 3가지 생성 (Gemini)
│   ├── generate_insight.py # 일일 인사이트 배치 생성 (cron)
│   ├── weekly.py           # 주간 리포트 웹훅 발송 (cron)
│   └── requirements.txt
├── vercel.json           # 라우팅 및 cron 스케줄 설정
└── .gitignore
```

> 프론트(HTML/CSS/JS)와 백엔드(api/)를 폴더로 명확히 분리하고, 백엔드는 각 기능(태그 분류, 조합, 확장, 인사이트, 리포트)마다 파일을 나눠 하나의 서버리스 함수가 하나의 책임만 갖도록 구성했습니다.

## 5. 실행 방법

### 로컬 실행

```bash
npm i -g vercel
vercel login
vercel dev
```

`vercel dev`는 `api/` 폴더의 Python 서버리스 함수와 정적 프론트엔드를 함께 로컬에서 실행해줍니다.
실행 전 아래 6번 항목의 환경 변수를 `.env` 파일 또는 `vercel env pull`로 준비해야 합니다.

### 배포 방법

1. GitHub 저장소(`woniri/codyssey-A1-3`)를 Vercel 프로젝트와 연동합니다.
2. Vercel 대시보드 → **Settings → Environment Variables**에 6번 항목의 키를 등록합니다.
3. `main` 브랜치에 push하면 자동으로 배포됩니다.
4. 기능 수정 시에는 별도 브랜치에서 작업 → Vercel이 자동 생성하는 **Preview 배포 URL**로 먼저 검증 → 문제없으면 `main`으로 merge하여 운영 배포에 반영합니다.

## 6. 환경 변수

API 키가 코드에 노출되지 않도록 아래 4개 값을 **Vercel 환경 변수**로만 관리합니다 (`.gitignore`에 `.env`류 모두 제외 처리됨).

| 변수명 | 용도 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | 프론트엔드 공개용 Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버(cron) 전용 Supabase 관리자 key — **절대 프론트에 노출 금지** |
| `GEMINI_API_KEY` | Google Gemini API 키 |

설정 방법: Vercel 프로젝트 → Settings → Environment Variables → 각 키/값 입력 → Save → 재배포.
로컬에서는 프로젝트 루트에 `.env`(또는 `.env.local`) 파일을 만들어 동일한 키를 넣고 사용합니다(이 파일들은 git에 포함되지 않습니다).

## 7. AI 기능

- **실타래 연금술** (`vault.html` → `api/expand.py`): 타래장에서 서로 다른 생각 두 개를 선택하면, Gemini가 두 생각을 조합해 새로운 기획 초안(제목+설명)을 생성해 화면에 표시합니다.
- **베틀** (`loom.html`): 선택한 생각 하나를 4가지 관점(창의적 파괴자/비즈니스 아키텍트/제1원리 분석가/실타래 연결자)으로 확장해 보여줍니다.
- 서버 쪽에는 문장 분류(`classify.py`), 두 문장 결합(`connect.py`) 등 추가 AI 엔드포인트도 준비되어 있어, 향후 홈 화면 실시간 태깅 등으로 확장할 수 있습니다.

## 8. 참고

- 크론 작업: 매일 21:00 `generate_insight` (일일 인사이트 캐싱), 매주 월요일 00:00 `weekly` (주간 리포트 웹훅 발송)
