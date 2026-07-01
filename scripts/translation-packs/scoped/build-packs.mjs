#!/usr/bin/env node
/**
 * Build scoped translation pack modules (si-pack.mjs, ur-pack.mjs, hi-pack.mjs)
 * from EN sources + per-locale translation tables.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'url'
import { flattenKeys } from '../../lib/flatten-keys.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const REPO = join(__dir, '../../..')
const SOURCES_EN = join(REPO, 'sources/en')

const { siTables } = await import('./tables/si.mjs')
const { urTables } = await import('./tables/ur.mjs')
const { hiTables } = await import('./tables/hi.mjs')

const TABLES = { si: siTables, ur: urTables, hi: hiTables }

function listScopedPages() {
  const pages = {}
  for (const scope of ['account', 'app']) {
    for (const name of readdirSync(join(SOURCES_EN, scope))) {
      if (!name.endsWith('.page.json')) continue
      const doc = JSON.parse(readFileSync(join(SOURCES_EN, scope, name), 'utf8'))
      pages[doc.pageId] = flattenKeys(doc.keys ?? doc)
    }
  }
  const home = JSON.parse(readFileSync(join(SOURCES_EN, 'www/home.page.json'), 'utf8'))
  pages[home.pageId] = flattenKeys(home.keys ?? home)
  return pages
}

function buildPack(locale, enPages) {
  const tables = TABLES[locale]
  const pack = {}
  for (const [pageId, enFlat] of Object.entries(enPages)) {
    const table = tables[pageId]
    if (!table) throw new Error(`Missing table for ${locale}/${pageId}`)
    const page = {}
    for (const [key, enVal] of Object.entries(enFlat)) {
      if (typeof enVal !== 'string') continue
      if (!(key in table)) throw new Error(`Missing ${locale}/${pageId}/${key}`)
      page[key] = table[key]
    }
    pack[pageId] = page
  }
  return pack
}

function writePackModule(locale, pack) {
  const out = join(__dir, `${locale}-pack.mjs`)
  const body = `/** Auto-generated scoped pack for ${locale} — do not edit by hand; run build-packs.mjs */\nexport const scopedPack = ${JSON.stringify(pack, null, 2)}\n`
  writeFileSync(out, body)
}

const enPages = listScopedPages()
mkdirSync(__dir, { recursive: true })

for (const locale of ['si', 'ur', 'hi']) {
  const pack = buildPack(locale, enPages)
  writePackModule(locale, pack)
  const keyCount = Object.values(pack).reduce((a, p) => a + Object.keys(p).length, 0)
  console.log(`${locale}-pack.mjs: ${Object.keys(pack).length} pages, ${keyCount} keys`)
}
