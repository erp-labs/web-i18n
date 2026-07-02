import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'locales')
/** @type {Record<string, Record<string, Record<string, string>>>} */
export const LOCALE_OVERLAYS = {}

if (existsSync(DIR)) {
  for (const name of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
    const locale = name.replace(/\.json$/, '')
    LOCALE_OVERLAYS[locale] = JSON.parse(readFileSync(join(DIR, name), 'utf8'))
  }
}
