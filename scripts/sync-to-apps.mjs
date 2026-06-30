#!/usr/bin/env node
/**
 * Sync locale bundles from web-i18n back into product repos.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS, loadLocales, ERP_LABS_ROOT } from './lib/constants.mjs'
import { deepClone } from './lib/flatten-keys.mjs'

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function writeJson(path, data) {
  ensureDir(join(path, '..'))
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function listLocalePageFiles(locale, surface, acc = []) {
  const root = join(PATHS.locales, locale, surface)
  if (!existsSync(root)) return acc
  for (const name of readdirSync(root)) {
    if (name.endsWith('.page.json')) acc.push(join(root, name))
  }
  return acc
}

function syncEmployeeWeb() {
  const locales = loadLocales().filter((l) => l !== 'en')
  /** @type {Record<string, Record<string, unknown>>} */
  const merged = {}
  for (const locale of locales) {
    merged[locale] = {}
    for (const file of listLocalePageFiles(locale, 'app')) {
      const doc = JSON.parse(readFileSync(file, 'utf8'))
      const ns = doc.pageId.replace(/^app\./, '')
      merged[locale][ns] = doc.keys
    }
    if (Object.keys(merged[locale]).length === 0) continue
    const outPath = join(PATHS.employeeWebDict, `${locale}.json`)
    writeJson(outPath, merged[locale])
    console.log(`sync-to-apps: wrote ${outPath}`)
  }
}

function syncEmailLocales() {
  const outRoot = join(ERP_LABS_ROOT, 'infra-email', 'packages', 'email-templates', 'locales')
  ensureDir(outRoot)
  const locales = loadLocales().filter((l) => l !== 'en')
  for (const locale of locales) {
    const dir = join(PATHS.locales, locale, 'email')
    if (!existsSync(dir)) continue
    /** @type {Record<string, unknown>} */
    const bundle = {}
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.page.json')) continue
      const key = name.replace('.page.json', '')
      const doc = JSON.parse(readFileSync(join(dir, name), 'utf8'))
      bundle[key] = doc.keys
    }
    if (Object.keys(bundle).length === 0) continue
    writeJson(join(outRoot, `${locale}.json`), bundle)
    console.log(`sync-to-apps: wrote email locales/${locale}.json`)
  }
}

function main() {
  if (!existsSync(PATHS.employeeWebDict)) {
    console.warn('sync-to-apps: employee-web dictionaries path missing — skip app')
  } else {
    syncEmployeeWeb()
  }
  syncEmailLocales()
  console.log('sync-to-apps: done (www/account/docs sync is Phase 2 — MDX and admin dictionaries)')
}

main()
