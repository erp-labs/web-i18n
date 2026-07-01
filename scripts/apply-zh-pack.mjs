#!/usr/bin/env node
/**
 * Apply zh translation pack to account (full), app (overlay), and www/home.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS } from './lib/constants.mjs'
import { deepClone } from './lib/flatten-keys.mjs'
import { pages } from './translation-packs/zh-pages.mjs'

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function mergeKeys(target, overlay) {
  if (!overlay || typeof overlay !== 'object') return
  for (const [k, v] of Object.entries(overlay)) {
    if (typeof v === 'string') {
      target[k] = v
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) {
        target[k] = {}
      }
      mergeKeys(target[k], v)
    }
  }
}

function applyPage(enFile, mode) {
  const rel = enFile.slice(PATHS.sourcesEn.length + 1)
  const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
  const overlay = pages[enDoc.pageId]

  const locFile = join(PATHS.locales, 'zh', rel)
  if (mode === 'overlay' && !existsSync(locFile)) return false

  let locDoc
  if (mode === 'full') {
    locDoc = deepClone(enDoc)
    if (overlay) mergeKeys(locDoc.keys, overlay)
  } else {
    locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
    if (overlay) mergeKeys(locDoc.keys, overlay)
  }

  locDoc.sourceHash = enDoc.sourceHash
  locDoc.meta = {
    ...enDoc.meta,
    ...locDoc.meta,
    translationStatus: 'reviewed',
    method: 'cursor-ai',
  }
  writeJson(locFile, locDoc)
  return true
}

let updated = 0
for (const f of readdirSync(join(PATHS.sourcesEn, 'account')).filter((x) => x.endsWith('.page.json'))) {
  if (applyPage(join(PATHS.sourcesEn, 'account', f), 'full')) updated++
}
for (const f of readdirSync(join(PATHS.sourcesEn, 'app')).filter((x) => x.endsWith('.page.json'))) {
  if (applyPage(join(PATHS.sourcesEn, 'app', f), 'overlay')) updated++
}
if (pages['www.home']) {
  const enFile = join(PATHS.sourcesEn, 'www', 'home.page.json')
  if (applyPage(enFile, 'overlay')) updated++
}

console.log(`apply-zh-pack: updated ${updated} zh locale files`)
