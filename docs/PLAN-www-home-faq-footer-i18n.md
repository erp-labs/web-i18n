# www 홈 FAQ·푸터 번역 완료 기획서

> **범위:** www.vouus.com `/` 홈 FAQ 10문항 + shell footer 5컬럼  
> **관련:** [PLAN-translation-account-www-app.md](./PLAN-translation-account-www-app.md) · [PLAN-locale-persistence-cross-domain-ko.md](./PLAN-locale-persistence-cross-domain-ko.md)

---

## 1. 문제 요약

한국어 UI에서 하단 FAQ 5문항과 푸터 Company 컬럼이 영어로 노출되었습니다.

| 영역 | 미번역 EN (예) |
|------|----------------|
| FAQ | Can we switch plans mid-cycle? / Is there a free trial? / … / workflow automation |
| Footer | Company, About, … / Compliance Hub, Globalization / Developer SDK |

**근본 원인**

1. CP snapshot **10문항** FAQ vs locale **`faq_0`~`faq_4`** (5문항 LANDING 모델) 인덱스 불일치
2. `nav-config` **5컬럼**(Platform 추가) vs locale **`footer_0`~`footer_3`** (4컬럼) 드리프트

---

## 2. 목표

| # | 기준 |
|---|------|
| 1 | ko 홈 FAQ 10문항 전체 현지어 |
| 2 | ko 푸터 5컬럼 라벨 현지어 (glossary 예외: Developer SDK, eInvoice, SMB) |
| 3 | 11+ 비EN 로케일 key parity |
| 4 | `npm run sync` → `web-public` `pnpm run verify:www` |

---

## 3. 키 스키마

### FAQ (`www.home`)

CP snapshot 순서와 1:1:

| Key | EN question |
|-----|-------------|
| `faq_0_q/a` | What is included in the platform subscription? |
| `faq_1_q/a` | Are there user or system limits? |
| `faq_2_q/a` | Can we start small and expand later? |
| `faq_3_q/a` | Who is the Enterprise plan best suited for? |
| `faq_4_q/a` | What payment methods do you accept? |
| `faq_5_q/a` | Can we switch plans mid-cycle? |
| `faq_6_q/a` | Is there a free trial? |
| `faq_7_q/a` | What happens if we exceed our user limit? |
| `faq_8_q/a` | Do you offer annual discounts? |
| `faq_9_q/a` | What do you mean by workflow automation? |

### Footer (`www.shell`)

```
footer_0_*  Product
footer_1_*  Solutions
footer_2_*  Platform (신규)
footer_3_*  Developers (구 footer_2)
footer_4_*  Company (구 footer_3)
```

---

## 4. 구현 (완료)

| 산출물 | 경로 |
|--------|------|
| Patch script | `scripts/patch-www-home-faq-footer-i18n.mjs` |
| FAQ 번역 팩 | `scripts/translation-packs/www-home-faq-10-overlays.json` |
| EN 소스 | `sources/en/www/home.page.json`, `sources/en/www/shell.page.json` |
| Locale | `locales/{locale}/www/home.page.json`, `locales/{locale}/www/shell.page.json` |
| Sync 대상 | `web-public/apps/marketing-web/lib/i18n/*.json` |

**명령**

```bash
cd web-i18n
npm run patch:www-home-faq-footer   # EN + locale 갱신
node scripts/validate.mjs           # www/home·shell parity 확인
npm run sync                        # marketing-web 등 sync
```

**코드**

- `web-public` / `core-platform` `packages/shell`: Platform footer 컬럼, `NavDropdown.id`, `Footer` `section.id === 'developers'`

---

## 5. 잔여 (P2)

- `/pricing` FAQ — `pricing.page.json` 별도 `faq_0`~`faq_9` 확장
- Footer copyright `© … All rights reserved.` i18n
- `meta.translationStatus: reviewed` (P0 로케일 QA 후)

---

## 6. 검증

```bash
# web-i18n (www 파일만)
node scripts/validate.mjs 2>&1 | rg "www/(home|shell)" || echo OK

# web-public
pnpm run verify:www
pnpm --filter marketing-web run test:e2e -- e2e/locale-switch.spec.ts
```

수동: `https://www.vouus.com/?lang=ko` — FAQ 10문항 + footer 5컬럼 KO 확인
