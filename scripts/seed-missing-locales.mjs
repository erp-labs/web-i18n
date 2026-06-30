#!/usr/bin/env node
/**
 * Seed missing locales (th, id, ms, si, ur, hi) from EN with cursor-ai draft metadata.
 * Also seeds email + docs + account + www from EN where locale files are absent.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS, loadNonEnLocales, ERP_LABS_ROOT } from './lib/constants.mjs'
import { deepClone } from './lib/flatten-keys.mjs'

const NEW_APP_LOCALES = ['th', 'id', 'ms', 'si', 'ur', 'hi']

/** Minimal UI string overrides for cursor-ai first pass (common auth flows). */
const UI_OVERRIDES = {
  th: {
    'signin.title': 'เข้าสู่ระบบ',
    'signin.submitButton': 'เข้าสู่ระบบ',
    'signup.title': 'สมัครสมาชิก',
    'signup.submitButton': 'สร้างบัญชี',
    'common.loading': 'กำลังโหลด...',
    'common.logOut': 'ออกจากระบบ',
  },
  id: {
    'signin.title': 'Masuk',
    'signin.submitButton': 'Masuk',
    'signup.title': 'Daftar',
    'signup.submitButton': 'Buat akun',
    'common.loading': 'Memuat...',
    'common.logOut': 'Keluar',
  },
  ms: {
    'signin.title': 'Log masuk',
    'signin.submitButton': 'Log masuk',
    'signup.title': 'Daftar',
    'signup.submitButton': 'Cipta akaun',
    'common.loading': 'Memuatkan...',
    'common.logOut': 'Log keluar',
  },
  si: {
    'signin.title': 'පිවිසෙන්න',
    'signin.submitButton': 'පිවිසෙන්න',
    'signup.title': 'ලියාපදිංචි වන්න',
    'signup.submitButton': 'ගිණුම සාදන්න',
    'common.loading': 'පූරණය වෙමින්...',
    'common.logOut': 'ඉවත් වන්න',
  },
  ur: {
    'signin.title': 'سائن ان',
    'signin.submitButton': 'سائن ان',
    'signup.title': 'سائن اپ',
    'signup.submitButton': 'اکاؤنٹ بنائیں',
    'common.loading': 'لوڈ ہو رہا ہے...',
    'common.logOut': 'سائن آؤٹ',
  },
  hi: {
    'signin.title': 'साइन इन',
    'signin.submitButton': 'साइन इन',
    'signup.title': 'साइन अप',
    'signup.submitButton': 'खाता बनाएं',
    'common.loading': 'लोड हो रहा है...',
    'common.logOut': 'साइन आउट',
  },
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function writeJson(path, data) {
  ensureDir(join(path, '..'))
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function setByPath(obj, path, value) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (!(p in cur) || typeof cur[p] !== 'object') cur[p] = {}
    cur = cur[p]
  }
  cur[parts[parts.length - 1]] = value
}

function applyOverrides(keys, locale, namespace) {
  const out = deepClone(keys)
  const overrides = UI_OVERRIDES[locale] ?? {}
  for (const [path, value] of Object.entries(overrides)) {
    const [ns, ...rest] = path.split('.')
    if (ns !== namespace || rest.length === 0) continue
    setByPath(out, rest.join('.'), value)
  }
  return out
}

function appendVersion(pageId, locale, enHash) {
  const versionPath = join(PATHS.versions, `${pageId.replace(/\./g, '_')}.json`)
  /** @type {Array<Record<string, unknown>>} */
  let history = existsSync(versionPath) ? JSON.parse(readFileSync(versionPath, 'utf8')) : []
  const last = history.filter((h) => h.locale === locale).at(-1)
  const version = (typeof last?.version === 'number' ? last.version : 0) + 1
  history.push({
    version,
    enHash,
    locale,
    method: 'cursor-ai',
    at: new Date().toISOString(),
  })
  ensureDir(PATHS.versions)
  writeJson(versionPath, history)
  return version
}

function listEnPageFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) listEnPageFiles(p, acc)
    else if (name.name.endsWith('.page.json')) acc.push(p)
  }
  return acc
}

function main() {
  const targetLocales = loadNonEnLocales()
  let count = 0

  for (const enFile of listEnPageFiles(PATHS.sourcesEn)) {
    const rel = enFile.slice(PATHS.sourcesEn.length + 1)
    const enDoc = JSON.parse(readFileSync(enFile, 'utf8'))
    const namespace = enDoc.pageId?.split('.').slice(1).join('.') ?? ''

    for (const locale of targetLocales) {
      const locFile = join(PATHS.locales, locale, rel)
      if (existsSync(locFile)) continue

      let keys = deepClone(enDoc.keys ?? {})
      if (enDoc.surface === 'app' && NEW_APP_LOCALES.includes(locale)) {
        const ns = enDoc.pageId.replace(/^app\./, '')
        keys = applyOverrides(keys, locale, ns)
      }

      const locDoc = {
        pageId: enDoc.pageId,
        surface: enDoc.surface,
        route: enDoc.route,
        version: appendVersion(enDoc.pageId, locale, enDoc.sourceHash),
        sourceHash: enDoc.sourceHash,
        keys,
        meta: {
          ...enDoc.meta,
          translationStatus: NEW_APP_LOCALES.includes(locale) ? 'ai_draft' : 'ai_draft',
          method: 'cursor-ai',
        },
      }
      writeJson(locFile, locDoc)
      count++
    }
  }

  console.log(`seed-missing-locales: created ${count} locale page files`)
}

main()
