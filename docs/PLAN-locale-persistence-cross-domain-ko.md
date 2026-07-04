# 크로스 서브도메인 언어 설정 지속 (Locale Persistence)

> **범위:** www.vouus.com · account.vouus.com · app.vouus.com  
> **관련:** [PLAN-translation-account-www-app.md](./PLAN-translation-account-www-app.md) Phase G

---

## 1. 문제

언어 변경 후 다른 페이지·메뉴로 이동하면 UI가 영어로 돌아가는 증상. 원인은 단일 버그가 아니라 **인프라(쿠키 도메인·Rocket Loader)**, **클라이언트 i18n 타이밍**, **페이지별 번역 커버리지**가 겹친 복합 이슈.

---

## 2. 공통 SSOT

| 항목 | 값 |
|------|-----|
| 쿠키 | `PLATFORM_LOCALE` |
| 도메인 | `Domain=.vouus.com` (빌드 env `NEXT_PUBLIC_PRIMARY_DOMAIN` / `PRIMARY_DOMAIN`) |
| 이벤트 | `platform:locale-changed` |

### Surface별 모델

| Surface | URL | UI SSOT |
|---------|-----|---------|
| **www** | `/pricing` (flat) | cookie + `lib/i18n/{locale}.json` overlay |
| **account** | `/login` (flat) | cookie → `dictionaries/{locale}.json` |
| **app** | `/{slug}/{lang}/...` | URL `[lang]` + cookie 미러 |

---

## 3. Phase 0 — 운영 (코드 없음)

1. Cloudflare **Rocket Loader Off** — [marketing-web README §6](../web-public/apps/marketing-web/README.md)
2. GitHub Variables:
   - www: `NEXT_PUBLIC_PRIMARY_DOMAIN=vouus.com`
   - account: `ADMIN_PRIMARY_DOMAIN=vouus.com`
   - app: `EMPLOYEE_NEXT_PUBLIC_PRIMARY_DOMAIN=vouus.com`
3. `./scripts/sync-marketing-public-env.sh` (web-public)
4. CI: `node scripts/verify-locale-cross-domain-env.mjs`

### 프로덕션 진단 (15분)

- Korean 선택 → DevTools: `PLATFORM_LOCALE=ko`, `Domain=.vouus.com`
- 헤더 링크 **클릭** 네비 (주소창 Enter 아님) → `document.documentElement.lang === 'ko'`
- lang=ko인데 본문만 EN → **번역 커버리지**; lang=en 리셋 → **인프라/타이밍**

---

## 4. Phase 1 — www hardening (구현됨)

- [`applyMarketingLocale`](../../web-public/apps/marketing-web/lib/marketing-locale.ts) — cookie + localStorage + DOM + bundle prefetch
- [`MarketingLocaleSync`](../../web-public/apps/marketing-web/components/ui/MarketingLocaleSync.tsx) — `useLayoutEffect`, pathname/cookie sync
- [`LocaleSelector`](../../web-public/apps/marketing-web/components/layout/LocaleSelector.tsx) — `PLATFORM_LOCALE_CHANGED` 구독
- E2E: [`e2e/locale-switch.spec.ts`](../../web-public/apps/marketing-web/e2e/locale-switch.spec.ts)

---

## 5. Phase 2 — www 번역 커버리지 (진행)

- [`MarketingI18nSolutionPageSections`](../../web-public/apps/marketing-web/components/marketing/MarketingI18nSolutionPageSections.tsx) — solutions/* 본문 i18n
- 완료: `/solutions/finance` (ko reviewed), `/solutions/hr`, `/solutions/sales` (인프라 + EN fallback)
- 잔여: product/*, feature pages — web-i18n `www/*.page.json` 키 확장 후 `npm run sync`

---

## 6. Phase 3 — account (구현됨)

- [`AccountLocalePrefetch`](../../core-platform/apps/admin-web/components/ui/AccountLocalePrefetch.tsx)
- [`prefetchAccountDictionary`](../../core-platform/apps/admin-web/lib/get-account-dictionary.ts)
- [`LocaleSelector`](../../core-platform/apps/admin-web/components/layout/LocaleSelector.tsx) prefetch
- E2E: `admin-web/e2e/locale-login-funnel.spec.ts`, `locale-nav-ko.spec.ts`
- 번역: [PLAN Phase A](./PLAN-translation-account-www-app.md) (account 26페이지)

---

## 7. Phase 4 — app (구현됨)

- [`PLATFORM_LOCALE_EARLY_SCRIPT`](../../core-platform/packages/cookies/src/locale-early-script.ts) in employee root layout
- [`LangSync`](../../core-platform/apps/employee-web/components/lang-sync.tsx) — cookie change → URL `[lang]` rewrite
- [`buildTenantPortalUrls`](../../core-platform/apps/admin-web/lib/tenant-portal-url.ts) — `locale` 옵션
- middleware: `getDefaultLocale()` from cookie (기존)

---

## 8. QA 매트릭스

| # | 시나리오 |
|---|----------|
| Q1 | www locale → 3페이지 네비, lang+nav 유지 |
| Q2 | F5 reload → early script → ko |
| Q3 | www ko → account `/login` → ko shell |
| Q4 | account ko → app `/{tenant}/ko/signin` |
| Q5 | app ko → www → ko nav/hero |

자동화:

```bash
pnpm --filter marketing-web run test:e2e:locale
pnpm run test:e2e:admin-web  # locale-* specs
pnpm run test:e2e:client-web
```

---

## 9. 성공 기준

1. prod `PLATFORM_LOCALE` on `.vouus.com`, Rocket Loader off
2. www 클라이언트 네비 후 `lang=ko`, shell nav 한국어
3. account/app 동일 cookie로 locale 일치
4. 크로스 도메인 Q3–Q5 수동/자동 통과

---

## 10. Phase 5 — 브라우저 언어 bootstrap + CP locale analytics (구현됨)

### 공유 bootstrap (`@platform/cookies`)

- `detectBrowserPlatformLocale`, `resolvePlatformLocale`, `initializePlatformLocaleIfNeeded`
- `PLATFORM_LOCALE_EARLY_SCRIPT` — cookie/localStorage 없을 때 `navigator.languages` 감지 후 cookie 기록
- `reportLocalePreferenceEvent` — same-origin BFF → CP `locale_preference_events`

### Surface 적용

| Surface | Bootstrap | Analytics BFF |
|---------|-----------|---------------|
| www | `MarketingLocaleSync` + early script | Pages Function `functions/api/locale-analytics.js` |
| account | `AccountLocaleBootstrap` | `POST /api/locale-analytics` |
| app | `LangSync` + middleware `Accept-Language` | `POST /api/locale-analytics` |

### account → app handoff

- `buildTenantPortalUrls({ locale })` — dashboard summary가 request cookie locale 전달
- `PortalAccessCards` — 클라이언트 `useEffectiveLocale()`로 employee href 보정

### Control Plane

- D1 `locale_preference_events` (migration `0203`)
- `GET /internal/locale-preference-events`, `/summary`, `POST .../ingest`
- Operator UI: `/cp/locale-analytics`
