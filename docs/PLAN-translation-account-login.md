# account.vouus.com/login 다국어 번역 기획서 (구현 완료)

> **범위:** [account.vouus.com/login](https://account.vouus.com/login) 로그인 퍼널 — 14 UI 로케일  
> **상위 기획:** [PLAN-translation-account-www-app.md](./PLAN-translation-account-www-app.md)

## 구현 요약

| 항목 | 내용 |
|------|------|
| EN catalog | `web-i18n/sources/en/account/auth.*.page.json` 등 8 page |
| 번역 데이터 | `core-platform/scripts/i18n/login-funnel-translations.mjs` |
| 적용 스크립트 | `core-platform/scripts/i18n/apply-login-funnel-i18n.mjs` |
| Product dict | `apps/admin-web/dictionaries/{locale}.json` |
| E2E | `apps/admin-web/e2e/locale-login-funnel.spec.ts` (ko/ja/th/ar) |

## 로케일 (14)

`en` + `ko`, `ja`, `zh`, `ar`, `vi`, `th`, `id`, `ms`, `si`, `ur`, `hi`, `ru`, `my`

## Namespace 매핑

| pageId | dictionary namespace |
|--------|---------------------|
| `account.auth.signin` | `auth_signin` |
| `account.auth.verify` | `auth_verify` |
| `account.auth.password` | `auth_password` |
| `account.auth.loginChrome` | `auth_loginChrome` |
| `account.auth.forgotPassword` | `auth_forgotPassword` |
| `account.auth.oauthErrors` | `auth_oauthErrors` |
| `account.post.auth.popups` | `post_auth_popups` |
| `account.shell.legalFooter` | `shell_legalFooter` |

## 재적용

```bash
# core-platform root
node scripts/i18n/apply-login-funnel-i18n.mjs
pnpm --filter admin-web run dictionaries:check
```

## 수동 QA 체크리스트

- [ ] LocaleSelector로 14언어 전환 — `/login` 제목·설명·CTA 해당 언어
- [ ] `/login?portal_password_setup=1` — portal password setup copy
- [ ] `/login/verify` — OTP resend·digit aria-label
- [ ] Forgot password 모달 — 제목·본문·버튼
- [ ] `/login/set-password`, `/login/reset-password` — password 필드 라벨
- [ ] 푸터 legal links + Support — `shell_legalFooter`
- [ ] `?reason=session` — localized popup banner
- [ ] RTL (`ar`, `ur`) — 문자열 방향 (레이아웃 미러링은 follow-up)

## 검증

```bash
pnpm --filter admin-web run typecheck
pnpm --filter admin-web run dictionaries:check
pnpm run test:e2e:admin-web -- e2e/locale-login-funnel.spec.ts
```
