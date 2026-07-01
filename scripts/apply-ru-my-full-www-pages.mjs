#!/usr/bin/env node
/**
 * Apply full ru/my translations for www product/solutions pages (34-key templates).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const enDir = path.join(root, 'sources/en/www')
const dataPath = path.join(__dirname, 'translation-packs/data/ru-my-full-www-pages.json')

const FULL = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

for (const [stem, localeMap] of Object.entries(FULL)) {
  const enPath = path.join(enDir, `${stem}.page.json`)
  if (!fs.existsSync(enPath)) {
    console.warn(`skip missing en ${stem}`)
    continue
  }
  const enDoc = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  for (const [locale, overrides] of Object.entries(localeMap)) {
    const target = path.join(root, 'locales', locale, 'www', `${stem}.page.json`)
    const doc = JSON.parse(fs.readFileSync(target, 'utf8'))
    doc.keys = { ...enDoc.keys, ...overrides, path: enDoc.keys.path }
    fs.writeFileSync(target, `${JSON.stringify(doc, null, 2)}\n`)
    console.log(`full ${locale}/www/${stem}.page.json`)
  }
}

console.log('apply-ru-my-full-www-pages: done')
