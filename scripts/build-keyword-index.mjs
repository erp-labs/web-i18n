#!/usr/bin/env node
/**
 * Build keyword index from EN page keys for CP search.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS } from './lib/constants.mjs'
import { flattenKeys } from './lib/flatten-keys.mjs'

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'is', 'are', 'your', 'you',
  'this', 'that', 'with', 'from', 'at', 'by', 'be', 'as', 'it', 'not', 'please', 'if',
])

function listEnPageFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) listEnPageFiles(p, acc)
    else if (name.name.endsWith('.page.json')) acc.push(p)
  }
  return acc
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP.has(w))
}

function main() {
  /** @type {Record<string, { term: string, hits: Array<{ pageId: string, keyPath: string, en: string }> }>} */
  const index = {}

  for (const enFile of listEnPageFiles(PATHS.sourcesEn)) {
    const doc = JSON.parse(readFileSync(enFile, 'utf8'))
    const pageId = doc.pageId ?? enFile
    const flat = flattenKeys(doc.keys ?? {})
    for (const [keyPath, en] of Object.entries(flat)) {
      if (typeof en !== 'string') continue
      for (const term of tokenize(en)) {
        if (!index[term]) index[term] = { term, hits: [] }
        index[term].hits.push({ pageId, keyPath, en: en.slice(0, 120) })
      }
    }
  }

  const out = Object.values(index)
    .map((row) => ({ ...row, hits: row.hits.slice(0, 20) }))
    .sort((a, b) => a.term.localeCompare(b.term))

  mkdirSync(join(PATHS.indexKeywords, '..'), { recursive: true })
  writeFileSync(PATHS.indexKeywords, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
  console.log(`build-keyword-index: ${out.length} terms`)
}

main()
