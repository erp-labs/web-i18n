#!/usr/bin/env node
/**
 * Set meta.translationStatus to "reviewed" for scoped account/app/www locale files.
 * Usage: node scripts/mark-reviewed.mjs ar vi si ur hi
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS } from './lib/constants.mjs'

const DEFAULT_LOCALES = ['ar', 'vi', 'si', 'ur', 'hi']
const locales = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_LOCALES
const SURFACES = ['account', 'app', 'www']

let updated = 0

for (const locale of locales) {
  for (const surface of SURFACES) {
    const dir = join(PATHS.locales, locale, surface)
    if (!existsSync(dir)) continue
    const files = readdirSync(dir).filter((f) => f.endsWith('.page.json'))
    for (const file of files) {
      const path = join(dir, file)
      const doc = JSON.parse(readFileSync(path, 'utf8'))
      if (doc.meta?.translationStatus === 'reviewed') continue
      doc.meta = { ...doc.meta, translationStatus: 'reviewed' }
      writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
      updated++
    }
  }
}

console.log(`mark-reviewed: updated ${updated} files for [${locales.join(', ')}]`)
