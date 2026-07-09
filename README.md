# 🧵 타래 (Tarae)

> 머릿속에 떠오른 생각 조각(실마리)을 가볍게 던져 저장하고, 흩어진 조각들을 서로 엮어(베틀·타래장) 새로운 아이디어로 발전시키는 개인 생각 관리 웹 서비스

- **배포 URL**: https://think-tarae.vercel.app/
- **GitHub 저장소**: https://github.com/woniri/codyssey-A1-3

---

## 1. 서비스 소개

하루에도 여러 번 스쳐 지나가는 아이디어와 생각들은 대부분 기록되지 못한 채 사라집니다.
**타래**는 그런 생각의 파편을 "실마리"로 가볍게 던져 저장하고, 시간이 지나 다시 꺼내 보거나
서로 다른 생각을 이어 붙여 새로운 기획으로 발전시킬 수 있도록 돕는 서비스입니다.

- 홈 화면은 저장된 생각을 바탕으로 **오늘의 실마리(AI 인사이트)**, **머릿속 기상도(태그 클라우드)**,
  **뜻밖의 공명(과거 생각 리마인드)**을 실시간으로 보여주고, 각 요소를 클릭하면 타래장·베틀로 바로 이동합니다.
- **베틀**에서는 생각 하나를 4명의 AI 전문가 관점(창의적 파괴자/비즈니스 아키텍트/제1원리 분석가/실타래 연결자)으로 분석합니다.
- **타래장**에서는 전체 생각을 네트워크 그래프로 시각화하고, 서로 다른 생각 2개를 AI로 조합하는
  **실타래 연금술** 기능을 제공합니다.
- **설정** 페이지에서 디스코드/슬랙 등 여러 채널을 동시에 등록해두고, 그중 원하는 채널로 리포트를 테스트 발송할 수 있습니다.

## 2. 페이지 구성

| 페이지 | 파일 | 설명 |
|---|---|---|
| 실마리 (홈) | `index.html` | 생각 입력, 오늘의 AI 인사이트, 태그 클라우드, 뜻밖의 공명, 실타래 상태 지표(각각 클릭 시 관련 페이지로 이동) |
| 베틀 | `loom.html` | 생각 하나를 골라 AI 4인 전문가 패널이 분석 |
| 타래장 | `vault.html` | 전체 생각/프로젝트를 그래프로 시각화, 태그·프로젝트·오래된 생각 필터, AI 실타래 연금술 |
| 설정 | `settings.html` | 자동발송 스케줄 설정, 채널별(디스코드/슬랙/노션/Gmail/텔레그램) 개별 등록 및 테스트 발송 |

네비게이션 바(모든 페이지 상단)를 통해 4개 페이지를 자유롭게 이동할 수 있고, 다크 모드를 지원합니다.

## 3. 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | 바닐라 HTML / CSS / JavaScript (프레임워크 미사용) |
| 시각화 | vis-network (타래장 그래프) |
| 백엔드 | Vercel Serverless Functions (Python) |
| 데이터베이스 · 인증 | Supabase (Postgres + Auth + RLS) |
| AI | Google Gemini API (`gemini-2.5-flash`, `google-generativeai` SDK) |
| 배포 | Vercel (GitHub 연동 자동 배포) |
| 알림 | Discord / Slack Webhook (서버 프록시 경유) |

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
├── js/
│   ├── app.js            # 다크모드 토글, 인증 세션 가드
│   ├── storage.js        # Supabase 클라이언트 초기화 및 CRUD 래퍼(TaraeStorage)
│   ├── main.js            # 홈 대시보드 실시간 데이터 연동(인사이트/태그클라우드/공명/지표)
│   └── stream.js         # 홈 화면 생각 입력/저장(낙관적 UI 처리)
├── api/                  # 백엔드 (Vercel Serverless Functions, Python)
│   ├── config.py          # 프론트에 Supabase 공개 키 전달
│   ├── classify.py        # 생각 문장 → 태그/공감 문장 생성 (Gemini, 확장 대기 중)
│   ├── connect.py         # 두 생각 조각 → 병합된 새 아이디어 생성 (타래장 실타래 연금술용)
│   ├── expand.py           # 생각 1개 → 4인 전문가 관점 생성 (베틀용)
│   ├── test_notify.py      # 디스코드/슬랙 테스트 발송 프록시(CORS 회피)
│   ├── generate_insight.py # 일일 인사이트 배치 생성 (cron)
│   ├── weekly.py           # 주간 리포트 웹훅 발송 로직 (현재 자동 실행은 의도적으로 중지)
│   └── requirements.txt
├── vercel.json           # 라우팅 및 cron 스케줄 설정
└── .gitignore
```

## 5. 실행 방법

### 로컬 실행

```bash
npm i -g vercel
vercel login
vercel link                      # 프로젝트와 연결
vercel env pull .env.local        # Vercel에 등록된 환경 변수를 로컬로 받아오기
vercel dev
```

> ⚠️ Vercel 환경 변수는 Production/Preview/Development 스코프가 각각 따로 관리됩니다.
> `vercel env pull`은 기본적으로 **Development** 스코프 값을 받아오므로, 대시보드에서
> Production에만 등록해뒀다면 로컬에서는 값이 비어있을 수 있습니다. 이 경우
> `vercel env add <KEY> development`로 Development 전용 값을 별도 등록해야 합니다.

### 배포 방법

1. GitHub 저장소(`woniri/codyssey-A1-3`)를 Vercel 프로젝트와 연동합니다.
2. Vercel 대시보드 → **Settings → Environment Variables**에 6번 항목의 키를 등록합니다.
3. `main` 브랜치에 push하면 자동으로 배포됩니다.
4. 기능 수정 시에는 별도 브랜치에서 작업 → Vercel이 자동 생성하는 **Preview URL**로 먼저 검증 → 문제없으면 `main`으로 merge하여 운영 배포에 반영합니다.

## 6. 환경 변수

API 키가 코드에 노출되지 않도록 아래 4개 값을 **Vercel 환경 변수**로만 관리합니다 (`.gitignore`에 `.env`류 모두 제외 처리됨).

| 변수명 | 용도 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | 프론트엔드 공개용 Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버(cron) 전용 Supabase 관리자 key — **절대 프론트에 노출 금지** |
| `GEMINI_API_KEY` | Google Gemini API 키 |

설정 방법: Vercel 프로젝트 → Settings → Environment Variables → 각 키/값 입력 시 **Production, Preview, Development 모두 체크** → Save → 재배포.

## 7. 데이터베이스 (Supabase)

- `thoughts`: 사용자별 생각 파편 (content, tags, comfort, created_at, project_id)
- `projects`: 베틀에서 엮인 기획/할 일 목록
- `daily_insights`: 일일 인사이트 캐시 (cron으로 매일 생성, 홈 화면 "오늘의 실마리"가 여기서 읽어옴)
- `user_settings`: 자동발송 사용 여부, 수확 범위, 발송 주기·시각
- `user_notification_channels`: 채널(디스코드/슬랙/노션/Gmail/텔레그램)별 웹훅 주소와 발송 포함 여부를
  **채널마다 한 행씩** 저장 — 여러 채널을 동시에 등록하고, 그중 여러 개를 동시에 발송 대상으로 지정할 수 있습니다.
  (RLS 정책으로 본인 데이터만 읽고 쓸 수 있도록 보호되어 있습니다.)

## 8. AI 기능

- **베틀** (`loom.html` → `api/expand.py`): 생각 1개를 입력하면 Gemini가 4명의 서로 다른 관점(창의적 파괴자/비즈니스 아키텍트/제1원리 분석가/실타래 연결자)으로 분석해 반환합니다.
- **실타래 연금술** (`vault.html` → `api/connect.py`): 서로 다른 생각 2개를 선택하면 Gemini가 둘을 조합해 새로운 기획 초안(제목+설명)을 생성합니다.
- 두 기능 모두 로딩 상태를 화면에 명확히 표시하고, 실패 시 사용자에게 안내 문구를 보여줍니다.
- `api/classify.py`(문장 1개 → 태그/공감 문장)는 준비되어 있으나 아직 프론트와 연결되지 않은 확장 여지로 남겨두었습니다.

## 9. 참고 — 발송 자동화 관련

- 매주 리포트 자동 발송(`api/weekly.py`, cron)은 기능은 구현되어 있으나, Vercel/Gemini 무료 사용량 한도 문제로
  **현재 자동 실행은 의도적으로 멈춰둔 상태**입니다. 대신 설정 페이지의 "즉시 테스트 발송"으로 채널 연결 자체는 바로 확인할 수 있습니다.
- 디스코드/슬랙 웹훅은 브라우저에서 직접 호출하면 CORS 정책에 막힐 수 있어, `api/test_notify.py`라는 서버 프록시를 한 단계 거치도록 구성했습니다.
