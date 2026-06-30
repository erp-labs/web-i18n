#!/usr/bin/env node
/**
 * Extract English canonical copy from product repos into sources/en/.
 * Updates manifest/pages.json and versions/{pageId}.json on EN hash change.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'
import {
  APP_ROUTE_BY_NAMESPACE,
  EMAIL_TEMPLATE_KEYS,
  ERP_LABS_ROOT,
  PATHS,
  REPO_ROOT,
} from './lib/constants.mjs'
import { flattenKeys } from './lib/flatten-keys.mjs'
import { hashJson } from './lib/hash.mjs'

/** @typedef {{ pageId: string, surface: string, route: string | null, version: number, sourceHash: string, reviewRequired?: boolean, keys: Record<string, unknown>, meta: Record<string, string> }} PageDoc */

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function writeJson(path, data) {
  ensureDir(join(path, '..'))
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function loadPagesManifest() {
  return JSON.parse(readFileSync(PATHS.manifestPages, 'utf8'))
}

function savePagesManifest(manifest) {
  writeJson(PATHS.manifestPages, manifest)
}

function bumpVersion(pageId, enHash, prevVersion = 0) {
  const versionPath = join(PATHS.versions, `${pageId.replace(/\./g, '_')}.json`)
  /** @type {Array<{ version: number, enHash: string, locale: string, method: string, at: string }>} */
  let history = []
  if (existsSync(versionPath)) {
    history = JSON.parse(readFileSync(versionPath, 'utf8'))
  }
  const nextVersion = prevVersion + 1
  history.push({
    version: nextVersion,
    enHash,
    locale: 'en',
    method: 'extract',
    at: new Date().toISOString(),
  })
  ensureDir(PATHS.versions)
  writeJson(versionPath, history)
  return nextVersion
}

/** @type {PageDoc[]} */
const extractedPages = []

function registerPage(doc) {
  extractedPages.push(doc)
  const relPath = `sources/en/${doc.surface}/${basename(doc.meta.githubPath || '')}`
  const outPath = join(REPO_ROOT, relPath)
  writeJson(outPath, doc)
}

function extractEmployeeWeb() {
  const enPath = join(PATHS.employeeWebDict, 'en.json')
  if (!existsSync(enPath)) {
    console.warn('skip app: employee-web dictionaries/en.json not found')
    return
  }
  const en = JSON.parse(readFileSync(enPath, 'utf8'))
  for (const [namespace, keys] of Object.entries(en)) {
    const pageId = `app.${namespace}`
    const route = APP_ROUTE_BY_NAMESPACE[namespace] ?? `/{companyId}/{locale}/${namespace}`
    const sourceHash = hashJson(keys)
    const fileName = `${namespace}.page.json`
    const doc = {
      pageId,
      surface: 'app',
      route,
      version: 1,
      sourceHash,
      keys,
      meta: {
        productRepo: 'core-platform',
        sourcePath: `apps/employee-web/dictionaries/en.json#${namespace}`,
        githubPath: `app/${fileName}`,
      },
    }
    doc.version = bumpVersion(pageId, sourceHash, 0)
    registerPage(doc)
  }
}

function extractEmailTemplates() {
  for (const key of EMAIL_TEMPLATE_KEYS) {
    const tsPath = join(PATHS.emailTemplates, `${key}.ts`)
    if (!existsSync(tsPath)) continue
    const src = readFileSync(tsPath, 'utf8')
    /** @type {Record<string, string>} */
    const keys = {}
    keys.subject = extractEmailSubject(key, src)
    keys._sourceNote = `Extracted from ${key}.ts — full HTML/text managed in web-i18n locales; template code uses locale resolver.`
    const pageId = `email.${key.replace(/-/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${key}.page.json`
    const doc = {
      pageId,
      surface: 'email',
      route: null,
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      keys,
      meta: {
        productRepo: 'infra-email',
        sourcePath: `packages/email-templates/src/${key}.ts`,
        githubPath: `email/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function extractEmailSubject(templateKey, src) {
  if (templateKey === 'otp') return 'Your verification code'
  const m = src.match(/subject:\s*['"`]([^'"`]+)['"`]/)
  if (m) return m[1]
  const m2 = src.match(/build\w+Subject\([^)]*\)/)
  return m2 ? `Dynamic subject (${templateKey})` : `${templateKey} email`
}

function extractLegalDocs() {
  if (!existsSync(PATHS.docsLegal)) {
    console.warn('skip docs: legal folder not found')
    return
  }
  for (const name of readdirSync(PATHS.docsLegal)) {
    if (!/\.(mdx|md)$/.test(name)) continue
    const slug = name.replace(/\.(mdx|md)$/, '')
    const full = readFileSync(join(PATHS.docsLegal, name), 'utf8')
    const titleMatch = full.match(/^title:\s*['"]?([^'"\n]+)/m)
    const title = titleMatch?.[1]?.trim() ?? slug
    const body = full.replace(/^---[\s\S]*?---\s*/m, '').trim()
    const keys = { title, body: body.slice(0, 5000) }
    const pageId = `docs.legal.${slug.replace(/-/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${slug}.page.json`
    const doc = {
      pageId,
      surface: 'docs',
      route: `/legal/${slug}`,
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      reviewRequired: true,
      keys,
      meta: {
        productRepo: 'web-public',
        sourcePath: `apps/docs/src/content/docs/legal/${name}`,
        githubPath: `docs/legal/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function extractMarketingRegistry() {
  const cpRegistry = join(ERP_LABS_ROOT, 'infra-control-plane', 'src', 'marketing-pages', 'registry.ts')
  if (existsSync(cpRegistry)) {
    extractMarketingFromCpRegistry(cpRegistry)
    return
  }
  const registryPath = join(PATHS.marketingWeb, 'content', 'registry.json')
  if (!existsSync(registryPath)) {
    const alt = join(PATHS.marketingWeb, 'lib', 'marketing-pages-registry.json')
    if (!existsSync(alt)) {
      console.warn('skip www: marketing registry not found')
      return
    }
    extractMarketingFromRegistry(alt)
    return
  }
  extractMarketingFromRegistry(registryPath)
}

function extractMarketingFromCpRegistry(tsPath) {
  const src = readFileSync(tsPath, 'utf8')
  /** @type {Array<{ pageKey: string, path: string, meta_title: string, meta_description: string }>} */
  const entries = []

  const eightRe =
    /eightSection\(\s*'([^']+)',\s*\n?\s*'((?:\\'|[^'\\])*)',\s*\n?\s*'((?:\\'|[^'\\])*)'/g
  for (const m of src.matchAll(eightRe)) {
    entries.push({
      pageKey: m[1],
      path: `/${m[1]}`,
      meta_title: m[2].replace(/\\'/g, "'"),
      meta_description: m[3].replace(/\\'/g, "'"),
    })
  }

  const objectRe =
    /page_key:\s*'([^']+)'[\s\S]*?path:\s*'([^']+)'[\s\S]*?meta_title:\s*'((?:\\'|[^'\\])*)'[\s\S]*?meta_description:\s*\n?\s*'((?:\\'|[^'\\])*)'/g
  for (const m of src.matchAll(objectRe)) {
    if (entries.some((e) => e.pageKey === m[1])) continue
    entries.push({
      pageKey: m[1],
      path: m[2],
      meta_title: m[3].replace(/\\'/g, "'"),
      meta_description: m[4].replace(/\\'/g, "'"),
    })
  }

  for (const entry of entries) {
    const keys = {
      path: entry.path,
      meta_title: entry.meta_title,
      meta_description: entry.meta_description,
    }
    const pageId = `www.${entry.pageKey.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${entry.pageKey.replace(/\//g, '_')}.page.json`
    const doc = {
      pageId,
      surface: 'www',
      route: entry.path,
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      keys,
      meta: {
        productRepo: 'infra-control-plane',
        sourcePath: `src/marketing-pages/registry.ts ${entry.pageKey}`,
        githubPath: `www/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function extractMarketingFromRegistry(registryPath) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  const pages = Array.isArray(registry) ? registry : registry.pages ?? []
  for (const page of pages) {
    const pageKey = page.page_key ?? page.key ?? page.id
    if (!pageKey) continue
    const keys = {
      path: page.path ?? '/',
      meta_title: page.meta_title ?? page.title ?? pageKey,
      meta_description: page.meta_description ?? '',
    }
    if (page.content_payload && typeof page.content_payload === 'object') {
      keys.content = page.content_payload
    }
    const pageId = `www.${pageKey.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${pageKey}.page.json`
    const doc = {
      pageId,
      surface: 'www',
      route: page.path ?? '/',
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      keys,
      meta: {
        productRepo: 'web-public',
        sourcePath: `apps/marketing-web (registry) ${pageKey}`,
        githubPath: `www/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function extractAccountPlaceholders() {
  const pages = [
    { pageId: 'account.auth.signup', route: '/signup', keys: { title: 'Create your account', submit: 'Sign up' } },
    { pageId: 'account.auth.signin', route: '/sign-in', keys: { title: 'Sign in', submit: 'Continue' } },
    { pageId: 'account.onboarding.company', route: '/onboarding', keys: { title: 'Company setup', submit: 'Continue' } },
    { pageId: 'account.billing.upgrade', route: '/billing/upgrade', keys: { title: 'Upgrade plan', submit: 'Upgrade' } },
  ]
  for (const p of pages) {
    const sourceHash = hashJson(p.keys)
    const fileName = `${p.pageId.split('.').slice(1).join('.')}.page.json`
    const doc = {
      pageId: p.pageId,
      surface: 'account',
      route: p.route,
      version: bumpVersion(p.pageId, sourceHash, 0),
      sourceHash,
      keys: p.keys,
      meta: {
        productRepo: 'core-platform',
        sourcePath: `apps/admin-web ${p.route}`,
        githubPath: `account/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function main() {
  ensureDir(PATHS.sourcesEn)
  extractEmployeeWeb()
  extractEmailTemplates()
  extractLegalDocs()
  extractMarketingRegistry()
  extractAccountPlaceholders()

  const manifest = loadPagesManifest()
  manifest.pages = extractedPages.map((p) => ({
    pageId: p.pageId,
    surface: p.surface,
    route: p.route,
    version: p.version,
    sourceHash: p.sourceHash,
    reviewRequired: p.reviewRequired ?? false,
    githubPath: p.meta.githubPath,
    sourcePath: p.meta.sourcePath,
  }))
  savePagesManifest(manifest)
  console.log(`extract-from-apps: wrote ${extractedPages.length} pages`)
}

main()
