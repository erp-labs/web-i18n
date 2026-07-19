#!/usr/bin/env node
/**
 * Sync locale bundles from web-i18n back into product repos.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { PATHS, loadLocales, ERP_LABS_ROOT } from './lib/constants.mjs'

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function writeJson(path, data) {
  ensureDir(dirname(path))
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function writeText(path, data) {
  ensureDir(dirname(path))
  writeFileSync(path, data, 'utf8')
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Deep-merge plain objects; `overlay` wins on conflict. Arrays/primitives replaced. */
function deepMerge(base, overlay) {
  if (
    !base ||
    typeof base !== 'object' ||
    Array.isArray(base) ||
    !overlay ||
    typeof overlay !== 'object' ||
    Array.isArray(overlay)
  ) {
    return overlay
  }
  /** @type {Record<string, unknown>} */
  const out = { ...base }
  for (const [key, value] of Object.entries(overlay)) {
    const prev = out[key]
    if (
      prev &&
      typeof prev === 'object' &&
      !Array.isArray(prev) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      out[key] = deepMerge(prev, value)
    } else {
      out[key] = value
    }
  }
  return out
}

function normalizeTitle(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/** Strip body `# H1` when it matches frontmatter title (Starlight already renders title as H1). */
function stripMatchingTitleH1(body, title) {
  const want = normalizeTitle(title)
  if (!want || !body) return body

  const lines = body.split('\n')
  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (trimmed === '') {
      i += 1
      continue
    }
    if (trimmed.startsWith('{/*')) {
      while (i < lines.length && !lines[i].includes('*/}')) i += 1
      i += 1
      continue
    }
    if (trimmed.startsWith('<!--')) {
      while (i < lines.length && !lines[i].includes('-->')) i += 1
      i += 1
      continue
    }
    break
  }

  if (i >= lines.length) return body
  const h1Match = lines[i].match(/^\s*#\s+(.+?)\s*$/)
  if (!h1Match) return body
  if (normalizeTitle(h1Match[1]) !== want) return body

  lines.splice(i, 1)
  if (i < lines.length && lines[i].trim() === '') lines.splice(i, 1)
  return lines.join('\n').replace(/^\n+/, '')
}

function listLocalePageFiles(locale, surface, acc = []) {
  const root = join(PATHS.locales, locale, surface)
  if (!existsSync(root)) return acc
  for (const name of readdirSync(root)) {
    if (name.endsWith('.page.json')) acc.push(join(root, name))
  }
  return acc
}

function mergeSurfacePagesAtRoot(rootDir, surface) {
  /** @type {Record<string, unknown>} */
  const merged = {}
  const surfaceDir = join(rootDir, surface)
  if (!existsSync(surfaceDir)) return merged
  for (const name of readdirSync(surfaceDir)) {
    if (!name.endsWith('.page.json')) continue
    const doc = JSON.parse(readFileSync(join(surfaceDir, name), 'utf8'))
    const ns = doc.pageId.replace(new RegExp(`^${surface}\\.`), '').replace(/\./g, '_')
    merged[ns] = doc.keys
  }
  return merged
}

function mergeSurfacePages(locale, surface) {
  const root = locale === 'en' ? PATHS.sourcesEn : join(PATHS.locales, locale)
  return mergeSurfacePagesAtRoot(root, surface)
}

function syncEmployeeWeb() {
  const locales = loadLocales().filter((l) => l !== 'en')
  for (const locale of locales) {
    const merged = mergeSurfacePages(locale, 'app')
    if (Object.keys(merged).length === 0) continue
    const outPath = join(PATHS.employeeWebDict, `${locale}.json`)
    /** @type {Record<string, unknown>} */
    const byNamespace = {}
    for (const file of listLocalePageFiles(locale, 'app')) {
      const doc = JSON.parse(readFileSync(file, 'utf8'))
      const ns = doc.pageId.replace(/^app\./, '')
      byNamespace[ns] = doc.keys
    }
    writeJson(outPath, byNamespace)
    console.log(`sync-to-apps: wrote ${outPath}`)
  }
}

function syncAdminWeb() {
  const adminDict = join(ERP_LABS_ROOT, 'core-platform', 'apps', 'admin-web', 'dictionaries')
  ensureDir(adminDict)
  for (const locale of loadLocales()) {
    /** @type {Record<string, unknown>} */
    const synced = {}
    const surface = locale === 'en' ? PATHS.sourcesEn : join(PATHS.locales, locale)
    const accountDir = join(surface, 'account')
    if (!existsSync(accountDir)) continue
    for (const name of readdirSync(accountDir)) {
      if (!name.endsWith('.page.json')) continue
      const doc = JSON.parse(readFileSync(join(accountDir, name), 'utf8'))
      const key = doc.pageId.replace(/^account\./, '').replace(/\./g, '_')
      synced[key] = doc.keys
    }
    if (Object.keys(synced).length === 0) continue
    const outPath = join(adminDict, `${locale}.json`)
    const existing = readJsonIfExists(outPath)
    // Preserve product-only namespaces/keys (e.g. portal_seats, usageAlertCritical).
    const merged =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? deepMerge(existing, synced)
        : synced
    writeJson(outPath, merged)
    console.log(`sync-to-apps: wrote admin-web/dictionaries/${locale}.json`)
  }
}

/**
 * Keep only web-i18n locale strings that differ from EN (real translations).
 * EN-identical overlay values are skipped so product translations are not clobbered.
 */
function realTranslationOverlay(webLocPages, webEnPages) {
  /** @type {Record<string, Record<string, unknown>>} */
  const overlay = {}
  for (const [pageId, page] of Object.entries(webLocPages)) {
    if (!page || typeof page !== 'object' || Array.isArray(page)) continue
    const enPage = webEnPages[pageId]
    /** @type {Record<string, unknown>} */
    const outPage = {}
    for (const [key, value] of Object.entries(page)) {
      if (key === 'translationStatus') {
        outPage[key] = value
        continue
      }
      const enVal =
        enPage && typeof enPage === 'object' && !Array.isArray(enPage) ? enPage[key] : undefined
      if (typeof value === 'string' && typeof enVal === 'string' && value === enVal) continue
      outPage[key] = value
    }
    if (Object.keys(outPage).length > 0) overlay[pageId] = outPage
  }
  return overlay
}

/** Exact key parity with EN for check-i18n-bundles (fill only brand-new gaps). */
function alignLocaleToEnKeys(enPages, localePages) {
  /** @type {Record<string, Record<string, unknown>>} */
  const aligned = {}
  for (const [pageId, enPage] of Object.entries(enPages)) {
    if (!enPage || typeof enPage !== 'object' || Array.isArray(enPage)) continue
    const locPage =
      localePages[pageId] && typeof localePages[pageId] === 'object' && !Array.isArray(localePages[pageId])
        ? localePages[pageId]
        : {}
    /** @type {Record<string, unknown>} */
    const page = {}
    for (const key of Object.keys(enPage)) {
      if (key in locPage) page[key] = locPage[key]
      else page[key] = enPage[key]
    }
    if ('translationStatus' in locPage) page.translationStatus = locPage.translationStatus
    aligned[pageId] = page
  }
  return aligned
}

function syncMarketingWeb() {
  const outRoot = join(ERP_LABS_ROOT, 'web-public', 'apps', 'marketing-web', 'lib', 'i18n')
  ensureDir(outRoot)
  const existingEn = readJsonIfExists(join(outRoot, 'en.json'))
  const webEn = mergeSurfacePages('en', 'www')
  // Preserve product-only EN keys; overlay web-i18n updates (do not shrink the bundle).
  const enPages =
    existingEn && typeof existingEn === 'object' && !Array.isArray(existingEn)
      ? deepMerge(existingEn, webEn)
      : webEn
  writeJson(join(outRoot, 'en.json'), enPages)

  for (const locale of loadLocales().filter((l) => l !== 'en')) {
    const webLoc = mergeSurfacePages(locale, 'www')
    if (Object.keys(webLoc).length === 0 && Object.keys(enPages).length === 0) continue
    const outPath = join(outRoot, `${locale}.json`)
    const existing = readJsonIfExists(outPath)
    const existingPages =
      existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {}
    const overlay = realTranslationOverlay(webLoc, webEn)
    const merged = deepMerge(existingPages, overlay)
    const aligned = alignLocaleToEnKeys(enPages, merged)
    writeJson(outPath, aligned)
    console.log(`sync-to-apps: wrote marketing-web/lib/i18n/${locale}.json`)
  }
}

function slugToMdxFilename(pageId) {
  const slug = pageId.replace(/^docs\.legal\./, '').replace(/_/g, '-')
  return `${slug}.mdx`
}

function syncDocsLegal() {
  const docsContent = join(
    ERP_LABS_ROOT,
    'web-public',
    'apps',
    'docs',
    'src',
    'content',
    'docs',
  )
  const enDir = join(PATHS.sourcesEn, 'docs')
  if (!existsSync(enDir)) return

  for (const name of readdirSync(enDir)) {
    if (!name.endsWith('.page.json')) continue
    const slug = name.replace('.page.json', '').replace(/_/g, '-')
    const mdxName = `${slug}.mdx`

    for (const locale of loadLocales().filter((l) => l !== 'en')) {
      const locFile = join(PATHS.locales, locale, 'docs', name)
      if (!existsSync(locFile)) continue
      const locDoc = JSON.parse(readFileSync(locFile, 'utf8'))
      const rawBody = String(locDoc.keys?.body ?? '').trim()
      if (!rawBody) continue
      const outDir = join(docsContent, 'legal-translations', locale)
      ensureDir(outDir)
      const title = locDoc.keys?.title ?? slug
      // Starlight renders frontmatter title as H1; drop matching body H1 (verify-no-duplicate-page-titles).
      const body = stripMatchingTitleH1(rawBody, title)
      const mdx = `---
title: ${JSON.stringify(title)}
description: Legal document (${locale})
pageId: ${JSON.stringify(locDoc.pageId)}
locale: ${locale}
sourceSlug: ${JSON.stringify(slug)}
---

${body}
`
      writeText(join(outDir, mdxName), mdx)
      console.log(`sync-to-apps: wrote docs legal-translations/${locale}/${mdxName}`)
    }
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
  if (existsSync(PATHS.employeeWebDict)) syncEmployeeWeb()
  else console.warn('sync-to-apps: employee-web dictionaries missing — skip app')
  syncAdminWeb()
  syncMarketingWeb()
  syncDocsLegal()
  syncEmailLocales()
  console.log('sync-to-apps: done')
}

main()
