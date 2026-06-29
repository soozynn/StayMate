# Stay-mate — Sujin's Home Stay

개인 게스트하우스 숙박 예약을 위한 웹 애플리케이션입니다.

**배포 URL:** [https://stay-mate-delta.vercel.app](https://stay-mate-delta.vercel.app)

## 주요 기능

- **소셜 로그인** — Google, Kakao, Naver OAuth 지원
- **날짜 예약** — 체크인·체크아웃 날짜 및 인원 선택 (당일 예약 가능)
- **예약 승인 흐름** — 관리자 승인 후 예약 확정, 카카오톡으로 입출차 번호 안내
- **인증 라우트 보호** — `/book/confirm` 이후 단계는 로그인 필요
- **관리자 페이지** — 예약 현황 확인 및 승인/거절 처리

## 기술 스택

| 항목 | 사용 기술 |
|------|-----------|
| 프레임워크 | Next.js (App Router, Turbopack) |
| 인증 | Auth.js v5 (next-auth) |
| 데이터베이스 | MongoDB Atlas + MongoDBAdapter |
| 스타일 | Tailwind CSS |
| 이메일 | SMTP (Resend) |
| 패키지 매니저 | pnpm |

## 시작하기

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env`에 아래 값을 채워주세요. (로컬 개발용 — Vercel 배포 시에는 Vercel 대시보드 Environment Variables에서 별도 입력)

| 변수 | 설명 |
|------|------|
| `MONGODB_URI` | MongoDB Atlas 연결 문자열 |
| `MONGODB_DB` | 데이터베이스 이름 |
| `ADMIN_EMAILS` | 관리자 이메일 (쉼표로 여러 개 가능) |
| `AUTH_SECRET` | Auth.js 서명 키 (`npx auth secret`으로 생성) |
| `AUTH_URL` | 로컬: `http://localhost:3000` / 배포: `https://stay-mate-delta.vercel.app` |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth 앱 자격증명 |
| `KAKAO_CLIENT_ID/SECRET` | Kakao 개발자 앱 자격증명 |
| `NAVER_CLIENT_ID/SECRET` | Naver 개발자 앱 자격증명 |
| `SMTP_*` | SMTP 서버 정보 (Resend 권장) |
| `MAIL_FROM` | 발신 이메일 주소 |

### 2. 의존성 설치 및 실행

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인하세요.

## 배포

Vercel에 배포 시 위 환경 변수를 Vercel 프로젝트 Settings → Environment Variables에 추가하고,
각 OAuth 앱의 콜백 URL을 아래와 같이 등록해야 합니다.

| 서비스 | 등록할 콜백 URL |
|--------|----------------|
| Google | `https://stay-mate-delta.vercel.app/api/auth/callback/google` |
| Kakao | `https://stay-mate-delta.vercel.app/api/auth/callback/kakao` |
| Naver | `https://stay-mate-delta.vercel.app/api/auth/callback/naver` |
