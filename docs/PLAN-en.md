# web-i18n platform plan

## Goals

Deliver user-facing copy and email templates in **12 locales** with **English as canonical**. Copy lives in the public **[erp-labs/web-i18n](https://github.com/erp-labs/web-i18n)** repo; Control Plane **`/cp/i18n`** (English operator UI) tracks coverage, approvals, and GitHub sync.

## Surfaces

| Surface | Domain |
|---------|--------|
| www | www.vouus.com |
| account | account.vouus.com |
| app | app.vouus.com |
| docs | docs.vouus.com/legal/* (whitelist for more) |
| email | all send paths |

**Out of scope:** CP `/cp/*` chrome; Frappe/Odoo pack content (links only in CP).

## Locales

`en`, `ja`, `ko`, `zh`, `ar`, `vi`, `th`, `id`, `ms`, `si`, `ur`, `hi` — see `manifest/locales.json`.

## Repository layout

- `sources/en/` — edit English here first
- `locales/{locale}/` — translated page files
- `manifest/pages.json` — registry (from `npm run extract`)
- `scripts/` — extract, validate, sync, keyword index

## Workflow

```bash
npm run extract              # product repos → sources/en
npm run batch:import-existing  # reuse employee-web ko/ja/…
npm run batch:seed-missing   # cursor-ai draft for new locales
npm run verify               # key parity + keyword index
npm run sync                 # → employee-web dictionaries, email locales/
```

## Cursor AI prompt (per page)

Translate `sources/en/{surface}/{page}.page.json` values to `{locale}`. Keep keys, `{placeholders}`, and HTML. Do not translate product terms in `manifest/glossary.json`.

## Control Plane

Migration **0192**, internal API **`/internal/v1/i18n/*`**, operator runbook in **infra-control-plane**.

## Phase 2

End-user language picker, ERP VM locale, full admin/marketing/docs sync.

---

Korean summary: [PLAN-ko.md](./PLAN-ko.md)
