#!/usr/bin/env node
/**
 * Align www home FAQ (10 CP snapshot items) and shell footer (5 columns) i18n keys.
 * Run from web-i18n root: node scripts/patch-www-home-faq-footer-i18n.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { PATHS, loadNonEnLocales } from './lib/constants.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKS = join(__dirname, 'translation-packs')
const faqOverlays = JSON.parse(readFileSync(join(PACKS, 'www-home-faq-10-overlays.json'), 'utf8'))
const shellOverlaysPath = join(PACKS, 'www-shell-overlays.json')
const shellOverlays = JSON.parse(readFileSync(shellOverlaysPath, 'utf8'))
const enSourceKeysPath = join(PACKS, 'en-source-keys.json')
const enSourceKeys = JSON.parse(readFileSync(enSourceKeysPath, 'utf8'))
const heroCta = JSON.parse(readFileSync(join(PACKS, 'www-home-hero-cta.json'), 'utf8'))

const FAQ_KEYS = Object.keys(faqOverlays.en)

/** Optional per-locale footer Platform item overrides (Compliance Hub, AI Agent Manager). */
const FOOTER_PLATFORM_ITEM_OVERRIDES = {
  ko: {
    footer_2_item_2_label: 'AI 에이전트 매니저',
    footer_2_item_3_label: '컴플라이언스 허브',
  },
  ja: {
    footer_2_item_2_label: 'AI Agent Manager',
    footer_2_item_3_label: 'コンプライアンスハブ',
  },
  zh: {
    footer_2_item_2_label: 'AI Agent Manager',
    footer_2_item_3_label: '合规中心',
  },
  ar: {
    footer_2_item_3_label: 'مركز الامتثال',
  },
  vi: {
    footer_2_item_3_label: 'Trung tâm tuân thủ',
  },
  th: {
    footer_2_item_3_label: 'ศูนย์ Compliance',
  },
  id: {
    footer_2_item_3_label: 'Pusat kepatuhan',
  },
  ms: {
    footer_2_item_3_label: 'Hab pematuhan',
  },
}

const EN_SHELL_FOOTER = {
  footer_2_label: 'Platform',
  footer_2_item_0_label: 'System Architecture',
  footer_2_item_1_label: 'Connectors',
  footer_2_item_2_label: 'AI Agent Manager',
  footer_2_item_3_label: 'Compliance Hub',
  footer_2_item_4_label: 'Globalization',
  footer_3_label: 'Developers',
  footer_3_item_0_label: 'Docs',
  footer_3_item_1_label: 'Developer SDK',
  footer_3_item_2_label: 'System Status',
  footer_4_label: 'Company',
  footer_4_item_0_label: 'About',
  footer_4_item_1_label: 'Careers',
  footer_4_item_2_label: 'Blog',
  footer_4_item_3_label: 'Help Center',
  footer_4_item_4_label: 'Pricing',
}

/** Platform footer label per locale (fallback EN). */
const PLATFORM_FOOTER_LABEL = {
  ko: '플랫폼',
  ja: 'プラットフォーム',
  zh: '平台',
  ar: 'المنصة',
  vi: 'Nền tảng',
  th: 'แพลตฟอร์ม',
  id: 'Platform',
  ms: 'Platform',
  si: 'Platform',
  ur: 'پلیٹ فارم',
  hi: 'प्लेटफ़ॉर्म',
  ru: 'Платформа',
  my: 'Platform',
}

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

function reindexFooterOverlay(overlay, locale) {
  const oldDev = {
    label: overlay.footer_2_label,
    items: [0, 1, 2].map((i) => overlay[`footer_2_item_${i}_label`]),
  }
  const oldCompany = {
    label: overlay.footer_3_label,
    items: [0, 1, 2, 3, 4].map((i) => overlay[`footer_3_item_${i}_label`]),
  }

  overlay.footer_2_label = PLATFORM_FOOTER_LABEL[locale] ?? 'Platform'
  overlay.footer_2_item_0_label =
    overlay.mega_3_section_0_item_0_label ?? EN_SHELL_FOOTER.footer_2_item_0_label
  overlay.footer_2_item_1_label =
    overlay.mega_3_section_0_item_3_label ?? EN_SHELL_FOOTER.footer_2_item_1_label
  overlay.footer_2_item_2_label =
    overlay.mega_3_section_1_item_3_label ?? EN_SHELL_FOOTER.footer_2_item_2_label
  overlay.footer_2_item_3_label =
    overlay.mega_3_section_1_item_2_label ?? EN_SHELL_FOOTER.footer_2_item_3_label
  overlay.footer_2_item_4_label =
    overlay.mega_3_section_1_item_4_label ?? EN_SHELL_FOOTER.footer_2_item_4_label

  overlay.footer_3_label = oldDev.label ?? EN_SHELL_FOOTER.footer_3_label
  for (let i = 0; i < 3; i++) {
    overlay[`footer_3_item_${i}_label`] = oldDev.items[i] ?? EN_SHELL_FOOTER[`footer_3_item_${i}_label`]
  }

  overlay.footer_4_label = oldCompany.label ?? EN_SHELL_FOOTER.footer_4_label
  for (let i = 0; i < 5; i++) {
    overlay[`footer_4_item_${i}_label`] =
      oldCompany.items[i] ?? EN_SHELL_FOOTER[`footer_4_item_${i}_label`]
  }

  delete overlay.footer_3_item_3_label
  delete overlay.footer_3_item_4_label

  const platformOverrides = FOOTER_PLATFORM_ITEM_OVERRIDES[locale]
  if (platformOverrides) {
    Object.assign(overlay, platformOverrides)
  }

  return overlay
}

function patchHomeEnSource() {
  const homeEnPath = join(PATHS.sourcesEn, 'www', 'home.page.json')
  const homeEnDoc = JSON.parse(readFileSync(homeEnPath, 'utf8'))
  const baseKeys = enSourceKeys['www.home'] ?? homeEnDoc.keys ?? {}

  const keys = { ...baseKeys, ...faqOverlays.en, hero_cta_primary: 'Start free trial', hero_cta_secondary: 'See it in 15 min' }
  enSourceKeys['www.home'] = keys

  const doc = {
    pageId: 'www.home',
    surface: 'www',
    route: '/',
    version: 3,
    sourceHash: hashKeys(keys),
    keys,
    meta: {
      productRepo: 'web-public',
      sourcePath: 'apps/marketing-web/lib/marketing-pages-cp-snapshot.json',
      githubPath: 'www/home.page.json',
    },
  }
  writeJson(homeEnPath, doc)
  writeJson(enSourceKeysPath, enSourceKeys)
  console.log(`patched sources/en/www/home.page.json (${Object.keys(keys).length} keys, ${FAQ_KEYS.length} FAQ keys)`)
  return keys
}

function patchShellEnSource() {
  const shellEnPath = join(PATHS.sourcesEn, 'www', 'shell.page.json')
  const shellEnDoc = JSON.parse(readFileSync(shellEnPath, 'utf8'))
  const keys = { ...shellEnDoc.keys, ...EN_SHELL_FOOTER }
  delete keys.footer_3_item_3_label
  delete keys.footer_3_item_4_label
  shellEnDoc.version = 3
  shellEnDoc.sourceHash = hashKeys(keys)
  shellEnDoc.keys = keys
  writeJson(shellEnPath, shellEnDoc)
  console.log(`patched sources/en/www/shell.page.json footer 5-col (${Object.keys(keys).length} keys)`)
  return keys
}

function patchLocaleHome(locale, homeEnKeys) {
  const homePath = join(PATHS.locales, locale, 'www', 'home.page.json')
  if (!existsSync(homePath)) {
    console.warn(`skip home ${locale}: missing file`)
    return
  }
  const doc = JSON.parse(readFileSync(homePath, 'utf8'))
  const overlay = faqOverlays[locale] ?? faqOverlays.en
  const faqOnly = Object.fromEntries(Object.entries(overlay).filter(([k]) => k.startsWith('faq_')))

  doc.keys = { ...doc.keys, ...faqOnly, ...(heroCta[locale] ?? {}) }
  for (const key of Object.keys(homeEnKeys)) {
    if (!(key in doc.keys)) doc.keys[key] = homeEnKeys[key]
  }
  doc.sourceHash = hashKeys(homeEnKeys)
  doc.version = 3
  doc.meta = {
    ...doc.meta,
    translationStatus: faqOverlays[locale] ? 'ai_draft' : 'pending',
    method: 'cursor-ai',
  }
  writeJson(homePath, doc)
  console.log(`patched locales/${locale}/www/home.page.json FAQ x10`)
}

function patchShellOverlays() {
  for (const locale of Object.keys(shellOverlays)) {
    const overlay = { ...shellOverlays[locale] }
    if (overlay.footer_4_label) {
      delete overlay.footer_3_item_3_label
      delete overlay.footer_3_item_4_label
      const platformOverrides = FOOTER_PLATFORM_ITEM_OVERRIDES[locale]
      if (platformOverrides) Object.assign(overlay, platformOverrides)
      shellOverlays[locale] = overlay
      continue
    }
    shellOverlays[locale] = reindexFooterOverlay(overlay, locale)
  }
  writeJson(shellOverlaysPath, shellOverlays)
  console.log(`reindexed www-shell-overlays.json footer keys for ${Object.keys(shellOverlays).length} locales`)
}

function patchLocaleShell(locale, shellEnKeys) {
  const shellPath = join(PATHS.locales, locale, 'www', 'shell.page.json')
  if (!existsSync(shellPath)) {
    console.warn(`skip shell ${locale}: missing file`)
    return
  }
  const overlay = shellOverlays[locale]
  if (!overlay) {
    console.warn(`skip shell ${locale}: no overlay`)
    return
  }
  const doc = JSON.parse(readFileSync(shellPath, 'utf8'))
  doc.keys = { path: '/', ...shellEnKeys, ...overlay }
  delete doc.keys.footer_3_item_3_label
  delete doc.keys.footer_3_item_4_label
  doc.sourceHash = hashKeys(shellEnKeys)
  doc.version = 3
  doc.meta = { ...doc.meta, translationStatus: 'ai_draft', method: 'cursor-ai' }
  writeJson(shellPath, doc)
  console.log(`patched locales/${locale}/www/shell.page.json footer 5-col`)
}

function main() {
  const homeEnKeys = patchHomeEnSource()
  const shellEnKeys = patchShellEnSource()
  patchShellOverlays()

  for (const locale of loadNonEnLocales()) {
    patchLocaleHome(locale, homeEnKeys)
    patchLocaleShell(locale, shellEnKeys)
  }
}

main()
