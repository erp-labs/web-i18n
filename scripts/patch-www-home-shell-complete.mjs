#!/usr/bin/env node
/**
 * Patch www home + shell locale page JSON from EN sources and translation packs.
 * Run from web-i18n root: node scripts/patch-www-home-shell-complete.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { PATHS, loadNonEnLocales } from './lib/constants.mjs'
import { deepClone } from './lib/flatten-keys.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKS = join(__dirname, 'translation-packs')
const shellOverlays = JSON.parse(readFileSync(join(PACKS, 'www-shell-overlays.json'), 'utf8'))
const heroCta = JSON.parse(readFileSync(join(PACKS, 'www-home-hero-cta.json'), 'utf8'))

const HOME_EN_PATH = join(PATHS.sourcesEn, 'www', 'home.page.json')

function hashKeys(keys) {
  const sorted = Object.keys(keys)
    .sort()
    .map((k) => `${k}:${keys[k]}`)
    .join('\n')
  return `sha256:${crypto.createHash('sha256').update(sorted).digest('hex')}`
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function loadHomeEnKeys() {
  const homeEn = JSON.parse(readFileSync(HOME_EN_PATH, 'utf8'))
  return { ...homeEn.keys }
}

function loadShellEnKeys() {
  const shellEn = JSON.parse(readFileSync(join(PATHS.sourcesEn, 'www', 'shell.page.json'), 'utf8'))
  const keys = { ...shellEn.keys }
  for (const key of Object.keys(shellOverlays.ko)) {
    if (!(key in keys)) keys[key] = enShellFallback(key)
  }
  return keys
}

function enShellFallback(key) {
  const EN = {
    mega_3_label: 'Why Vouus',
    mega_3_section_0_title: 'Architecture & Design',
    mega_3_section_0_item_0_label: 'System Architecture',
    mega_3_section_0_item_0_description: 'How Vouus connects your business',
    mega_3_section_0_item_1_label: 'Easy UI',
    mega_3_section_0_item_1_description: 'Task-based screens for everyday work',
    mega_3_section_0_item_2_label: 'Thin and Fast',
    mega_3_section_0_item_2_description: 'Edge-first, optimized for global teams',
    mega_3_section_0_item_3_label: 'Connectors',
    mega_3_section_0_item_3_description: 'Plug-and-play connector ecosystem',
    mega_3_section_0_item_4_label: 'Secure and Fast',
    mega_3_section_0_item_4_description: 'Deployment options and security model',
    mega_3_section_1_title: 'Business Value',
    mega_3_section_1_item_0_label: 'Market Position',
    mega_3_section_1_item_0_description: 'Where Vouus sits in the market',
    mega_3_section_1_item_1_label: 'Compare',
    mega_3_section_1_item_1_description: 'Vouus vs ERP, accounting, and SaaS tools',
    mega_3_section_1_item_2_label: 'Compliance Hub',
    mega_3_section_1_item_2_description: 'Government rules into workflows',
    mega_3_section_1_item_3_label: 'AI Agent Manager',
    mega_3_section_1_item_3_description: 'Manage AI agents like team members',
    mega_3_section_1_item_4_label: 'Globalization',
    mega_3_section_1_item_4_description: 'Multi-language, multi-country operations',
    mega_3_cta: 'Start free trial',
    mega_3_cta_secondary: 'Compare plans',
    ask_sales_label: 'Ask Sales',
    ask_sales_popup_title: 'Need a hand?',
    ask_sales_search_placeholder: 'Search docs',
    ask_sales_search_aria: 'Search documentation',
    ask_sales_help_0_label: 'Browse the docs',
    ask_sales_help_1_label: 'View our learning guides',
    ask_sales_help_2_label: 'Request a feature',
    ask_sales_help_3_label: "See what's new",
    ask_sales_help_4_label: 'Read our blog',
    ask_sales_help_5_label: 'System status',
    ask_sales_communities_label: 'Join our communities',
    ask_sales_chat_cta: 'Chat with an advisor',
  }
  return EN[key] ?? ''
}

async function loadHomeOverlay(locale) {
  const dataPath = join(PACKS, 'data', `${locale}.json`)
  if (existsSync(dataPath)) {
    const data = JSON.parse(readFileSync(dataPath, 'utf8'))
    if (data['www.home']) return data['www.home']
  }
  const arHome = join(PACKS, 'ar-account-home.mjs')
  if (locale === 'ar' && existsSync(arHome)) {
    const mod = await import(`file://${arHome}`)
    if (mod.AR_ACCOUNT_HOME?.['www.home']) return mod.AR_ACCOUNT_HOME['www.home']
  }
  const viHome = join(PACKS, 'vi-account-home-part2.mjs')
  if (locale === 'vi' && existsSync(viHome)) {
    const mod = await import(`file://${viHome}`)
    if (mod.VI_ACCOUNT_HOME_PART2?.['www.home']) return mod.VI_ACCOUNT_HOME_PART2['www.home']
  }
  const scopedPath = join(PACKS, 'scoped', `${locale}-pack.mjs`)
  if (existsSync(scopedPath)) {
    const mod = await import(`file://${scopedPath}`)
    const pack = mod.scopedPack ?? mod.default
    if (pack?.['www.home']) return pack['www.home']
  }
  return null
}

async function main() {
  const homeEnKeys = loadHomeEnKeys()
  const shellEnKeys = loadShellEnKeys()
  const shellEnBase = JSON.parse(readFileSync(join(PATHS.sourcesEn, 'www', 'shell.page.json'), 'utf8'))

  const homeEnDoc = {
    pageId: 'www.home',
    surface: 'www',
    route: '/',
    version: 2,
    sourceHash: hashKeys(homeEnKeys),
    keys: homeEnKeys,
    meta: {
      productRepo: 'web-public',
      sourcePath: 'apps/marketing-web/lib/home-section-content.ts',
      githubPath: 'www/home.page.json',
    },
  }
  writeJson(join(PATHS.sourcesEn, 'www', 'home.page.json'), homeEnDoc)
  console.log(`patched sources/en/www/home.page.json (${Object.keys(homeEnKeys).length} keys)`)

  const shellEnDoc = {
    ...shellEnBase,
    version: 2,
    sourceHash: hashKeys(shellEnKeys),
    keys: shellEnKeys,
  }
  writeJson(join(PATHS.sourcesEn, 'www', 'shell.page.json'), shellEnDoc)
  console.log(`patched sources/en/www/shell.page.json (${Object.keys(shellEnKeys).length} keys)`)

  for (const locale of loadNonEnLocales()) {
    const homePath = join(PATHS.locales, locale, 'www', 'home.page.json')
    const shellPath = join(PATHS.locales, locale, 'www', 'shell.page.json')

    const homeDoc = existsSync(homePath)
      ? JSON.parse(readFileSync(homePath, 'utf8'))
      : deepClone(homeEnDoc)
    homeDoc.keys = { ...homeEnKeys, ...homeDoc.keys, ...(heroCta[locale] ?? {}) }
    const homeOverlay = await loadHomeOverlay(locale)
    if (homeOverlay) {
      homeDoc.keys = { ...homeDoc.keys, ...homeOverlay, ...(heroCta[locale] ?? {}) }
    } else if (heroCta[locale]) {
      homeDoc.keys = { ...homeDoc.keys, ...heroCta[locale] }
    }
    homeDoc.sourceHash = hashKeys(homeEnKeys)
    homeDoc.meta = { ...homeDoc.meta, translationStatus: homeOverlay ? 'reviewed' : 'ai_draft', method: 'cursor-ai' }
    writeJson(homePath, homeDoc)
    console.log(`patched locales/${locale}/www/home.page.json`)

    const shellOverlay = shellOverlays[locale]
    if (!shellOverlay) {
      console.warn(`skip shell ${locale}: no overlay`)
      continue
    }
    const shellDoc = existsSync(shellPath)
      ? JSON.parse(readFileSync(shellPath, 'utf8'))
      : deepClone(shellEnDoc)
    shellDoc.keys = { path: '/', ...shellEnKeys, ...shellOverlay }
    shellDoc.sourceHash = hashKeys(shellEnKeys)
    shellDoc.meta = { ...shellDoc.meta, translationStatus: 'reviewed', method: 'cursor-ai' }
    writeJson(shellPath, shellDoc)
    console.log(`patched locales/${locale}/www/shell.page.json (${Object.keys(shellDoc.keys).length} keys)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
