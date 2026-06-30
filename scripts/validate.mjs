#!/usr/bin/env node
/**
 * Validate key parity between EN sources and all locale files.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS, REPO_ROOT, loadNonEnLocales } from './lib/constants.mjs'
import { flattenKeys } from './lib/flatten-keys.mjs'

const SECRET_PATTERNS = [
  /sk_live_/i,
  /sk_test_/i,
  /api[_-]?key\s*[:=]\s*['"][^'"]{8,}/i,
  /Bearer\s+[A-Za-z0-9._-]{20,}/,
]

function listEnPageFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) listEnPageFiles(p, acc)
    else if (name.name.endsWith('.page.json')) acc.push(p)
  }
  return acc
}

function scanSecrets(text, file) {
  for (const re of SECRET_PATTERNS) {
    if (re.test(text)) {
      console.error(`validate: possible secret in ${file}`)
      return false
    }
  }
  return true
}

function main() {
  let ok = true
  const locales = loadNonEnLocales()
  const enFiles = listEnPageFiles(PATHS.sourcesEn)

  for (const enFile of enFiles) {
    const rel = enFile.slice(PATHS.sourcesEn.length + 1)
    const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
    const enFlat = flattenKeys(enDoc.keys ?? enDoc)
    if (!scanSecrets(JSON.stringify(enDoc), rel)) ok = false

    for (const locale of locales) {
      const locFile = join(PATHS.locales, locale, rel)
      if (!existsSync(locFile)) {
        console.error(`validate: missing locale file ${locale}/${rel}`)
        ok = false
        continue
      }
      const locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
      const locFlat = flattenKeys(locDoc.keys ?? locDoc)
      if (!scanSecrets(JSON.stringify(locDoc), `${locale}/${rel}`)) ok = false

      for (const key of Object.keys(enFlat)) {
        if (!(key in locFlat)) {
          console.error(`validate: ${locale}/${rel} missing key ${key}`)
          ok = false
        }
      }
      for (const key of Object.keys(locFlat)) {
        if (!(key in enFlat)) {
          console.error(`validate: ${locale}/${rel} extra key ${key}`)
          ok = false
        }
      }
    }
  }

  const pages = JSON.parse(readFileSync(PATHS.manifestPages, 'utf8'))
  if (!Array.isArray(pages.pages) || pages.pages.length === 0) {
    console.error('validate: manifest/pages.json is empty — run npm run extract')
    ok = false
  }

  if (!ok) process.exit(1)
  console.log(`validate: OK (${enFiles.length} EN pages, ${locales.length} locales)`)
}

main()
