# web-i18n 다국어 플랫폼 기획서

## 1. 목표

Vouus 플랫폼 사용자-facing UI와 이메일을 **영문 기준**으로 12개 언어에 제공한다. 번역 본문은 공개 GitHub 레포 **[erp-labs/web-i18n](https://github.com/erp-labs/web-i18n)** 에 두고, Control Plane **`/cp/i18n`**(영문 UI)에서 커버리지·승인·동기화를 관리한다.

## 2. 번역 대상

| Surface | 도메인 | 비고 |
|---------|--------|------|
| Marketing | www.vouus.com | CP marketing registry 기준 |
| Admin portal | account.vouus.com | 인증·온보딩·빌링 |
| Employee app | app.vouus.com | employee-web dictionaries |
| Legal docs | docs.vouus.com/legal/* | 1차; 추가 섹션은 CP whitelist |
| Email | 전 채널 | infra-email 템플릿 |

**비대상:** Control Plane `/cp/*` 운영 UI, Frappe/Odoo 언어팩 본문(링크만).

## 3. 지원 로케일

`en`(기준), `ja`, `ko`, `zh`, `ar`, `vi`, `th`, `id`, `ms`, `si`, `ur`, `hi`

RTL: `ar`, `ur`

## 4. 레포 구조

- `sources/en/` — 영문 canonical (페이지별 JSON/MDX)
- `locales/{locale}/` — 번역 (동일 키 트리)
- `manifest/pages.json` — 페이지 레지스트리
- `index/keywords.json` — EN 키워드 색인
- `versions/` — 페이지·로케일별 버전 이력

## 5. 워크플로

1. **Extract** — `npm run extract` (product repo → EN)
2. **Cursor AI 1차 번역** — 페이지 단위, glossary 준수
3. **Validate** — `npm run verify` (키 parity)
4. **Sync** — `npm run sync` → employee-web / email-templates
5. **CP** — Sync from GitHub → D1 메타데이터

## 6. Control Plane

- D1 migration `0192_i18n_management.sql`
- Routes: `/cp/i18n`, `/cp/i18n/pages`, `/cp/i18n/docs-sections`, `/cp/i18n/email`, `/cp/i18n/external-packs`
- Runbook: **infra-control-plane/docs/runbook/i18n-management.md**

## 7. Phase 2

- 사용자 언어 선택 UI (`@platform/web-cookies` locale cookie)
- ERP VM locale (Frappe/Odoo)
- admin-web / marketing-web / docs MDX full sync

## 8. 품질

- Legal: `reviewRequired` + human review before `published`
- Public repo: 문자열만, secrets 금지
- employee-web: `dictionaries:check` CI

---

English spec: [PLAN-en.md](./PLAN-en.md)
