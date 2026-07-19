#!/usr/bin/env node
/**
 * Add www.shell demo_modal_* keys (EN + locales) and sync into marketing-web lib/i18n.
 * Run from web-i18n root: node scripts/patch-www-demo-modal-i18n.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { PATHS, loadNonEnLocales } from './lib/constants.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const overlays = JSON.parse(
  readFileSync(join(__dirname, 'translation-packs', 'www-demo-modal-overlays.json'), 'utf8'),
)

const DEMO_KEYS = Object.keys(overlays.en)

function sha256Keys(keys) {
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(keys)).digest('hex')}`
}

function patchPageJson(filePath, keyOverlay) {
  if (!existsSync(filePath)) {
    console.warn('missing', filePath)
    return false
  }
  const page = JSON.parse(readFileSync(filePath, 'utf8'))
  page.keys = { ...page.keys, ...keyOverlay }
  page.version = typeof page.version === 'number' ? page.version + 1 : 1
  page.sourceHash = sha256Keys(page.keys)
  writeFileSync(filePath, `${JSON.stringify(page, null, 2)}\n`, 'utf8')
  return true
}

function patchMarketingBundle(locale, keyOverlay) {
  const filePath = join(PATHS.marketingWeb, 'lib', 'i18n', `${locale}.json`)
  if (!existsSync(filePath)) {
    console.warn('missing marketing bundle', filePath)
    return false
  }
  const bundle = JSON.parse(readFileSync(filePath, 'utf8'))
  if (!bundle.shell || typeof bundle.shell !== 'object') {
    bundle.shell = {}
  }
  Object.assign(bundle.shell, keyOverlay)
  writeFileSync(filePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8')
  return true
}

const enShell = join(PATHS.sourcesEn, 'www', 'shell.page.json')
patchPageJson(enShell, overlays.en)
patchMarketingBundle('en', overlays.en)
console.log('patched EN www.shell + marketing en.json')

for (const locale of loadNonEnLocales()) {
  const overlay = overlays[locale] ?? overlays.en
  const localePage = join(PATHS.locales, locale, 'www', 'shell.page.json')
  patchPageJson(localePage, overlay)
  patchMarketingBundle(locale, overlay)
  console.log('patched', locale)
}

console.log('done demo_modal keys:', DEMO_KEYS.join(', '))
