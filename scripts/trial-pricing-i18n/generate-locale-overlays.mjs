#!/usr/bin/env node
/** One-shot generator for locale overlay JSON files. */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRICING_KEYS, TRIAL_KEYS, MA_VERIFY_KEYS, MA_COMPLETE_KEYS } from './en-keys.mjs'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'locales')
const stripPath = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'path'))

const pricing = stripPath(PRICING_KEYS)
const trial = stripPath(TRIAL_KEYS)
const trial_manual_approval_verify = stripPath(MA_VERIFY_KEYS)
const trial_manual_approval_complete = stripPath(MA_COMPLETE_KEYS)

// eslint-disable-next-line import/no-relative-packages
import { TRANSLATIONS } from './translations-all.mjs'

mkdirSync(OUT, { recursive: true })

for (const [locale, sections] of Object.entries(TRANSLATIONS)) {
  const doc = {
    pricing: sections.pricing,
    trial: sections.trial,
    trial_manual_approval_verify: sections.trial_manual_approval_verify,
    trial_manual_approval_complete: sections.trial_manual_approval_complete,
  }
  for (const [section, keys] of Object.entries(doc)) {
    const expected = section === 'pricing' ? pricing : section === 'trial' ? trial : section === 'trial_manual_approval_verify' ? trial_manual_approval_verify : trial_manual_approval_complete
    const missing = Object.keys(expected).filter((k) => !(k in keys))
    const extra = Object.keys(keys).filter((k) => !(k in expected))
    if (missing.length || extra.length) {
      throw new Error(`${locale}.${section}: missing=${missing.join(',')} extra=${extra.join(',')}`)
    }
  }
  writeFileSync(join(OUT, `${locale}.json`), `${JSON.stringify(doc, null, 2)}\n`)
  console.log(`${locale}.json: ${Object.values(doc).reduce((n, o) => n + Object.keys(o).length, 0)} keys`)
}
