#!/usr/bin/env node
/**
 * Patch account shell_billing body + billing_upgrade keys into web-i18n and admin-web dictionaries.
 * Does NOT run full sync-to-apps (would wipe users_detail etc.).
 * Run: node scripts/patch-account-billing-upgrade-i18n.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { PATHS, loadNonEnLocales } from './lib/constants.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packs = JSON.parse(
  readFileSync(join(__dirname, 'translation-packs', 'account-billing-upgrade-overlays.json'), 'utf8'),
)

function sha256Keys(keys) {
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(keys)).digest('hex')}`
}

function patchPage(filePath, keyOverlay) {
  if (!existsSync(filePath)) {
    console.warn('missing page', filePath)
    return
  }
  const page = JSON.parse(readFileSync(filePath, 'utf8'))
  page.keys = { ...page.keys, ...keyOverlay }
  page.version = typeof page.version === 'number' ? page.version + 1 : 1
  page.sourceHash = sha256Keys(page.keys)
  writeFileSync(filePath, `${JSON.stringify(page, null, 2)}\n`, 'utf8')
}

function patchAdminNamespace(locale, namespace, keyOverlay) {
  const filePath = join(PATHS.adminWeb, 'dictionaries', `${locale}.json`)
  if (!existsSync(filePath)) {
    console.warn('missing dict', filePath)
    return
  }
  const dict = JSON.parse(readFileSync(filePath, 'utf8'))
  dict[namespace] = { ...(dict[namespace] || {}), ...keyOverlay }
  writeFileSync(filePath, `${JSON.stringify(dict, null, 2)}\n`, 'utf8')
}

const billingEn = packs.shell_billing.en
const upgradeEn = packs.billing_upgrade.en

patchPage(join(PATHS.sourcesEn, 'account', 'shell.billing.page.json'), billingEn)
patchPage(join(PATHS.sourcesEn, 'account', 'billing.upgrade.page.json'), upgradeEn)
patchAdminNamespace('en', 'shell_billing', billingEn)
patchAdminNamespace('en', 'billing_upgrade', upgradeEn)
console.log('patched EN shell_billing + billing_upgrade')

for (const locale of loadNonEnLocales()) {
  const billing = packs.shell_billing[locale] ?? billingEn
  const upgrade = packs.billing_upgrade[locale] ?? upgradeEn
  patchPage(join(PATHS.locales, locale, 'account', 'shell.billing.page.json'), billing)
  patchPage(join(PATHS.locales, locale, 'account', 'billing.upgrade.page.json'), upgrade)
  patchAdminNamespace(locale, 'shell_billing', billing)
  patchAdminNamespace(locale, 'billing_upgrade', upgrade)
  console.log('patched', locale)
}

console.log('done')
