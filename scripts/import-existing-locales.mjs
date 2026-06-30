#!/usr/bin/env node
/**
 * Import existing employee-web locale JSON into web-i18n page files.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS, REPO_ROOT } from './lib/constants.mjs'
import { hashJson } from './lib/hash.mjs'

const EXISTING_APP_LOCALES = ['ko', 'ja', 'ar', 'vi', 'zh']

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function writeJson(path, data) {
  ensureDir(join(path, '..'))
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function appendVersion(pageId, locale, enHash, method) {
  const versionPath = join(PATHS.versions, `${pageId.replace(/\./g, '_')}.json`)
  /** @type {Array<Record<string, unknown>>} */
  let history = existsSync(versionPath) ? JSON.parse(readFileSync(versionPath, 'utf8')) : []
  const last = history.filter((h) => h.locale === locale).at(-1)
  const version = (typeof last?.version === 'number' ? last.version : 0) + 1
  history.push({
    version,
    enHash,
    locale,
    method,
    at: new Date().toISOString(),
  })
  ensureDir(PATHS.versions)
  writeJson(versionPath, history)
  return version
}

function main() {
  const enPath = join(PATHS.employeeWebDict, 'en.json')
  if (!existsSync(enPath)) {
    console.error('import-existing-locales: en.json not found')
    process.exit(1)
  }
  const en = JSON.parse(readFileSync(enPath, 'utf8'))
  let count = 0

  for (const locale of EXISTING_APP_LOCALES) {
    const locPath = join(PATHS.employeeWebDict, `${locale}.json`)
    if (!existsSync(locPath)) continue
    const loc = JSON.parse(readFileSync(locPath, 'utf8'))

    for (const namespace of Object.keys(en)) {
      if (!(namespace in loc)) continue
      const enKeys = en[namespace]
      const locKeys = loc[namespace]
      const pageId = `app.${namespace}`
      const enFile = join(PATHS.sourcesEn, 'app', `${namespace}.page.json`)
      if (!existsSync(enFile)) continue
      const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
      const enHash = enDoc.sourceHash ?? hashJson(enKeys)
      const locDoc = {
        pageId,
        surface: 'app',
        route: enDoc.route,
        version: appendVersion(pageId, locale, enHash, 'import-employee-web'),
        sourceHash: enHash,
        keys: locKeys,
        meta: {
          ...enDoc.meta,
          importedFrom: `apps/employee-web/dictionaries/${locale}.json#${namespace}`,
        },
      }
      const out = join(PATHS.locales, locale, 'app', `${namespace}.page.json`)
      writeJson(out, locDoc)
      count++
    }
  }

  console.log(`import-existing-locales: wrote ${count} locale page files`)
}

main()
