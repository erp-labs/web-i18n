#!/usr/bin/env node
/** Patch www EN page JSON with hero_title / hero_description for locale overlay. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const enDir = path.join(__dirname, '..', 'sources', 'en', 'www')

const HERO = {
  product_hr: {
    hero_title: 'HR wired to real approvals',
    hero_description:
      'People ops on one workflow spine—attendance, leave, and payroll share audit-ready history in {brand}.',
  },
  product_ocr: {
    hero_title: 'Receipts captured. Books updated.',
    hero_description:
      'Snap, extract, and approve—OCR turns paper into structured data on the expense workflow spine.',
  },
  product_erp: {
    hero_title: 'One system for how work moves',
    hero_description:
      '{brand} replaces disconnected tools with one workflow-first platform—start small, scale to enterprise.',
  },
  product_crm: {
    hero_title: 'Revenue your finance can reconcile',
    hero_description:
      'Sales pipeline, customer records, and billing share one workflow spine—finance sees the same thread sales does.',
  },
  product_bi: {
    hero_title: 'Numbers with provenance',
    hero_description:
      '{brand} analytics run on the same workflow spine as HR and finance—every chart traces back to an approval.',
  },
  product_accounting: {
    hero_title: 'Invoice to ledger—one chain',
    hero_description:
      '{brand} connects billing, approvals, and accounting on one workflow spine—no swivel-chair re-entry.',
  },
  solutions: {
    hero_title: 'Built for how your team works',
    hero_description:
      'Tailored by role and company size—one workflow spine for people, money, and approvals.',
  },
  solutions_sales: {
    hero_title: 'Revenue motion finance can see',
    hero_description:
      'Run pipeline, quotes, and orders on workflows that sync with billing and recognition—pipeline analytics flag risk; Automation keeps follow-ups from slipping between teams.',
  },
  solutions_hr: {
    hero_title: 'HR operations wired to real workflows',
    hero_description:
      'Keep records, payroll, attendance, leave, and hiring on one path—Automation nudges the routine work while approvals and Scheduler keep cutoffs honest.',
  },
  solutions_finance: {
    hero_title: 'Finance that follows the invoice-to-ledger thread',
    hero_description:
      'Run expense, eInvoice, and close as connected workflows—Scheduler and Automation handle the mechanical steps while approvals stay visible for auditors and leadership.',
  },
  solutions_startups: {
    hero_title: '5 people. One system. Day one ready.',
    hero_description:
      'Basic plan with core ERP, approvals, and workflow automation—built for founders who need clean books without shelfware.',
  },
  'solutions_enterprise_case-studies': {
    hero_title: 'Use case snapshots',
    hero_description:
      'Real workflow patterns from teams using {brand}—names anonymised, outcomes representative.',
  },
  'solutions_enterprise_system-status': {
    hero_title: 'System Status',
    hero_description: 'Real-time server and service status for {brand}.',
  },
  solutions_enterprise_security: {
    hero_title: 'Security Whitepapers',
    hero_description: 'Compliance, security practices, and data protection at {brand}.',
  },
  solutions_enterprise_dpa: {
    hero_title: 'Data Processing Agreement',
    hero_description: 'PDPA-aligned DPA between iPrego Pte. Ltd. and customers using {brand}.',
  },
}

function hashKeys(keys) {
  const sorted = Object.keys(keys)
    .sort()
    .map((k) => `${k}:${keys[k]}`)
    .join('\n')
  return `sha256:${crypto.createHash('sha256').update(sorted).digest('hex')}`
}

for (const [base, hero] of Object.entries(HERO)) {
  const file = path.join(enDir, `${base}.page.json`)
  if (!fs.existsSync(file)) {
    if (base === 'product_hr') {
      const payload = {
        pageId: 'www.product_hr',
        surface: 'www',
        route: '/product/hr',
        version: 1,
        sourceHash: '',
        keys: {
          path: '/product/hr',
          meta_title: 'People & HR',
          meta_description:
            'HR wired to real approvals—attendance, leave, and payroll on one connected spine.',
          ...hero,
        },
        meta: {
          productRepo: 'web-public',
          sourcePath: 'apps/marketing-web/app/product/hr/page.tsx',
          githubPath: 'www/product_hr.page.json',
        },
      }
      payload.sourceHash = hashKeys(payload.keys)
      fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`)
      console.log(`created ${base}.page.json`)
      continue
    }
    console.warn(`missing ${file}`)
    continue
  }
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  doc.keys = { ...doc.keys, ...hero }
  doc.sourceHash = hashKeys(doc.keys)
  fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`)
  console.log(`patched ${base}.page.json`)
}
