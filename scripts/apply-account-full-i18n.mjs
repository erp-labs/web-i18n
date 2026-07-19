#!/usr/bin/env node
/**
 * Apply full account i18n overlays for billing_upgrade, shell_billing fixes,
 * users_detail, shell_integrations across all non-en locales.
 *
 * Usage: node scripts/apply-account-full-i18n.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PATHS, loadNonEnLocales } from './lib/constants.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packPath = join(__dirname, 'translation-packs', 'account-full-i18n-overlays.json')
const pack = JSON.parse(readFileSync(packPath, 'utf8'))

const GLOSSARY_ALLOW = new Set([
  'workDeskBadge',
  'menuLabel_work_desk',
  'menuLabel_my_ai',
  'menuLabel_crm',
  'workMode_ceo',
  'desk_CRM',
  'desk_HR',
  'desk_Home',
  'workMode', // product term — keep "Work Mode" where overlay sets EN
])

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function mergeNs(locale, namespace, overlay) {
  if (!overlay || typeof overlay !== 'object') return
  const dictPath = join(PATHS.adminWeb, 'dictionaries', `${locale}.json`)
  const dict = JSON.parse(readFileSync(dictPath, 'utf8'))
  dict[namespace] = { ...(dict[namespace] || {}), ...overlay }
  writeJson(dictPath, dict)
}

function patchWebI18nPage(locale, fileName, overlay) {
  if (!overlay) return
  const pagePath = join(PATHS.locales, locale, 'account', fileName)
  if (!existsSync(pagePath)) return
  const page = JSON.parse(readFileSync(pagePath, 'utf8'))
  page.keys = { ...page.keys, ...overlay }
  writeJson(pagePath, page)
}

const locales = loadNonEnLocales()
const en = JSON.parse(readFileSync(join(PATHS.adminWeb, 'dictionaries', 'en.json'), 'utf8'))

for (const locale of locales) {
  const billingUpgrade = pack.billing_upgrade?.[locale]
  const shellBilling = pack.shell_billing?.[locale]
  const usersDetail = pack.users_detail?.[locale]
  const integrations = pack.shell_integrations?.[locale]

  mergeNs(locale, 'billing_upgrade', billingUpgrade)
  mergeNs(locale, 'shell_billing', shellBilling)
  mergeNs(locale, 'users_detail', usersDetail)
  mergeNs(locale, 'shell_integrations', integrations)

  patchWebI18nPage(locale, 'billing.upgrade.page.json', billingUpgrade)
  patchWebI18nPage(locale, 'shell.billing.page.json', shellBilling)

  console.log('applied', locale)
}

console.log('\n=== Remaining EN-identical (excl. glossary allowlist) ===')
for (const ns of ['shell_billing', 'billing_upgrade', 'users_detail', 'shell_integrations']) {
  const enNs = en[ns] || {}
  for (const locale of locales) {
    const d = JSON.parse(readFileSync(join(PATHS.adminWeb, 'dictionaries', `${locale}.json`), 'utf8'))[
      ns
    ] || {}
    const same = Object.keys(enNs).filter(
      (k) => !GLOSSARY_ALLOW.has(k) && d[k] === enNs[k],
    )
    if (same.length) console.log(`${ns}/${locale}: ${same.length} → ${same.slice(0, 12).join(', ')}`)
  }
}
console.log('done')
