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
    const merged = {}
    const surface = locale === 'en' ? PATHS.sourcesEn : join(PATHS.locales, locale)
    const accountDir = join(surface, 'account')
    if (!existsSync(accountDir)) continue
    for (const name of readdirSync(accountDir)) {
      if (!name.endsWith('.page.json')) continue
      const doc = JSON.parse(readFileSync(join(accountDir, name), 'utf8'))
      const key = doc.pageId.replace(/^account\./, '').replace(/\./g, '_')
      merged[key] = doc.keys
    }
    if (Object.keys(merged).length === 0) continue
    writeJson(join(adminDict, `${locale}.json`), merged)
    console.log(`sync-to-apps: wrote admin-web/dictionaries/${locale}.json`)
  }
}

/** Drop locale page keys not present in EN (marketing-web verify:i18n-bundles requires parity). */
function filterPagesToEnKeys(enPages, localePages) {
  /** @type {Record<string, Record<string, unknown>>} */
  const filtered = {}
  for (const [pageId, enPage] of Object.entries(enPages)) {
    if (!enPage || typeof enPage !== 'object' || Array.isArray(enPage)) continue
    const enKeys = Object.keys(enPage)
    const locPage = localePages[pageId]
    /** @type {Record<string, unknown>} */
    const page = {}
    for (const key of enKeys) {
      if (locPage && typeof locPage === 'object' && !Array.isArray(locPage) && key in locPage) {
        page[key] = locPage[key]
      } else if (key in enPage) {
        page[key] = enPage[key]
      }
    }
    filtered[pageId] = page
  }
  return filtered
}

function syncMarketingWeb() {
  const outRoot = join(ERP_LABS_ROOT, 'web-public', 'apps', 'marketing-web', 'lib', 'i18n')
  ensureDir(outRoot)
  const enPages = mergeSurfacePages('en', 'www')
  writeJson(join(outRoot, 'en.json'), enPages)
  for (const locale of loadLocales().filter((l) => l !== 'en')) {
    const merged = mergeSurfacePages(locale, 'www')
    if (Object.keys(merged).length === 0) continue
    const filtered = filterPagesToEnKeys(enPages, merged)
    writeJson(join(outRoot, `${locale}.json`), filtered)
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
      const body = String(locDoc.keys?.body ?? '').trim()
      if (!body) continue
      const outDir = join(docsContent, 'legal-translations', locale)
      ensureDir(outDir)
      const title = locDoc.keys?.title ?? slug
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
