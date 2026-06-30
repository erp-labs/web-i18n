/**
 * Legal page full body keys (terms, privacy, cookie, sla, responsible-ai) + compare feature keys.
 * Run: node scripts/patch-legal-full-body.mjs && npm run batch:seed-missing && npm run sync
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const P0_MAX_EN_IDENTICAL_RATIO = 0.85

const stats = {}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))
}

function writeJson(rel, data) {
  fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(data, null, 2)}\n`)
}

function mergeKeys(pagePath, extraKeys, metaPatch = {}) {
  const doc = readJson(pagePath)
  doc.keys = { ...doc.keys, ...extraKeys }
  if (Object.keys(metaPatch).length) doc.meta = { ...doc.meta, ...metaPatch }
  writeJson(pagePath, doc)
}

function countMerge(pagePath, extraKeys, metaPatch = {}) {
  const doc = readJson(pagePath)
  const existing = new Set(Object.keys(doc.keys))
  let newCount = 0
  let updatedCount = 0
  for (const [k, v] of Object.entries(extraKeys)) {
    if (!existing.has(k)) newCount++
    else if (doc.keys[k] !== v) updatedCount++
  }
  mergeKeys(pagePath, extraKeys, metaPatch)
  stats[pagePath] = { new: newCount, updated: updatedCount, merged: Object.keys(extraKeys).length }
}

function flattenSections(sections) {
  const keys = {}
  for (const section of sections) {
    keys[`${section.key}_title`] = section.title
    section.blocks.forEach((block, blockIndex) => {
      if (block.kind === 'p') {
        keys[`${section.key}_p${blockIndex}`] = block.text
      } else {
        block.items.forEach((item, itemIndex) => {
          keys[`${section.key}_ul${blockIndex}_li${itemIndex}`] = item
        })
      }
    })
  }
  return keys
}

function flattenSectionsPartial(sections, bodySectionKeys) {
  const bodySet = new Set(bodySectionKeys)
  const out = {}
  for (const section of sections) {
    if (!section.blocks) continue
    out[`${section.key}_title`] = section.title
    if (bodySet.has(section.key)) {
      const partial = flattenSections([section])
      for (const k of Object.keys(partial)) {
        if (!k.endsWith('_title')) out[k] = partial[k]
      }
    }
  }
  return out
}

function removeKeysMatching(pagePath, re) {
  const doc = readJson(pagePath)
  let removed = 0
  for (const k of Object.keys(doc.keys)) {
    if (re.test(k)) {
      delete doc.keys[k]
      removed++
    }
  }
  if (removed) writeJson(pagePath, doc)
  return removed
}

function enIdenticalRatio(enFlat, locFlat) {
  let comparable = 0
  let identical = 0
  for (const key of Object.keys(locFlat)) {
    if (!(key in enFlat)) continue
    if (typeof enFlat[key] !== 'string' || typeof locFlat[key] !== 'string') continue
    comparable += 1
    if (enFlat[key] === locFlat[key]) identical += 1
  }
  return comparable === 0 ? 0 : identical / comparable
}

function decideJaZhStatus(enRel, locRel, newKeys) {
  const enFlat = readJson(enRel).keys
  const locDoc = readJson(locRel)
  const merged = { ...locDoc.keys, ...newKeys }
  const ratio = enIdenticalRatio(enFlat, merged)
  return ratio <= P0_MAX_EN_IDENTICAL_RATIO ? 'reviewed' : 'ai_draft'
}

function patchJaLegal(pageRel, keys) {
  const locRel = `locales/ja/${pageRel}`
  const status = decideJaZhStatus(`sources/en/${pageRel}`, locRel, keys)
  countMerge(locRel, keys, { translationStatus: status, method: 'patch-legal-full-body' })
}

// ── EN section data ──────────────────────────────────────────────────────────

const termsSections = [
  {
    key: 's01',
    title: '1. Introduction',
    blocks: [
      { kind: 'p', text: 'These Terms of Service ("Terms") govern the access to and use of the {brand} platform and related services provided by iPrego Pte. Ltd., a company incorporated in Singapore.' },
      { kind: 'p', text: 'By accessing or using the {brand} platform, you agree to be bound by these Terms.' },
      { kind: 'p', text: 'If you do not agree with these Terms, you must not use the service.' },
    ],
  },
  {
    key: 's02',
    title: '2. About the Service',
    blocks: [
      { kind: 'p', text: '{brand} is a cloud-based Software-as-a-Service (SaaS) platform providing integrated business software solutions including:' },
      {
        kind: 'ul',
        items: [
          'Enterprise Resource Planning (ERP)',
          'Accounting and financial automation',
          'Human resource management',
          'Customer relationship management (CRM)',
          'Business analytics and reporting',
          'Workflow automation',
        ],
      },
      { kind: 'p', text: 'The services are delivered through web-based applications operated by iPrego Pte. Ltd.' },
    ],
  },
  {
    key: 's03',
    title: '3. Eligibility',
    blocks: [
      { kind: 'p', text: 'You must be at least 18 years of age and legally capable of entering into binding agreements to use the {brand} platform.' },
      { kind: 'p', text: 'If you use the service on behalf of an organization, you confirm that you have the authority to bind that organization to these Terms.' },
    ],
  },
  {
    key: 's04',
    title: '4. User Accounts',
    blocks: [
      { kind: 'p', text: 'To access certain services, users must create an account.' },
      { kind: 'p', text: 'You agree to:' },
      {
        kind: 'ul',
        items: [
          'provide accurate information',
          'maintain the confidentiality of login credentials',
          'notify us immediately of any unauthorized use of your account (contact: {support_email})',
        ],
      },
      { kind: 'p', text: 'Users are responsible for all activities conducted through their accounts.' },
    ],
  },
  {
    key: 's05',
    title: '5. Acceptable Use',
    blocks: [
      { kind: 'p', text: 'Users must not use the platform in a manner that:' },
      {
        kind: 'ul',
        items: [
          'violates applicable laws or regulations',
          'infringes intellectual property rights',
          'attempts to gain unauthorized access to systems',
          'disrupts the security or performance of the platform',
          'distributes malicious software',
        ],
      },
      { kind: 'p', text: 'iPrego Pte. Ltd. reserves the right to suspend or terminate accounts for misuse of the service.' },
    ],
  },
  {
    key: 's06',
    title: '6. Customer Data',
    blocks: [
      { kind: 'p', text: 'Customers retain ownership of all data uploaded to the platform.' },
      { kind: 'p', text: 'iPrego Pte. Ltd. acts as a data intermediary under Singapore PDPA when processing personal data on behalf of customers.' },
      { kind: 'p', text: 'We process such data solely for the purpose of providing the platform services.' },
      { kind: 'p', text: 'Customers remain responsible for ensuring their data collection and use complies with applicable laws.' },
    ],
  },
  {
    key: 's07',
    title: '7. Assisted and automated features',
    blocks: [
      { kind: 'p', text: 'The {brand} platform may include assisted and automated features designed to support business operations.' },
      { kind: 'p', text: 'System-generated outputs:' },
      {
        kind: 'ul',
        items: [
          'are provided for informational purposes',
          'may require user verification',
          'should not be relied upon as professional advice',
        ],
      },
      { kind: 'p', text: 'Users remain responsible for reviewing automated or suggested decisions before execution.' },
    ],
  },
  {
    key: 's08',
    title: '8. Fees and Subscription',
    blocks: [
      { kind: 'p', text: 'Certain features of the platform require paid subscriptions.' },
      { kind: 'p', text: 'Customers agree to:' },
      {
        kind: 'ul',
        items: ['pay applicable subscription fees', 'maintain valid billing information', 'comply with payment terms'],
      },
      { kind: 'p', text: 'Subscriptions may renew automatically unless cancelled before the renewal date.' },
    ],
  },
  {
    key: 's09',
    title: '9. Service Availability',
    blocks: [
      { kind: 'p', text: 'iPrego Pte. Ltd. aims to provide reliable service availability.' },
      { kind: 'p', text: 'However, service interruptions may occur due to:' },
      {
        kind: 'ul',
        items: ['system maintenance', 'infrastructure updates', 'unforeseen technical issues'],
      },
      { kind: 'p', text: 'Reasonable efforts will be made to restore service promptly.' },
    ],
  },
  {
    key: 's10',
    title: '10. Intellectual Property',
    blocks: [
      { kind: 'p', text: 'All rights in the {brand} platform, including software, design, and content, are owned by iPrego Pte. Ltd. or its licensors.' },
      { kind: 'p', text: 'Users are granted a limited, non-exclusive, non-transferable license to access and use the platform.' },
      { kind: 'p', text: 'Users may not copy, modify, distribute, or reverse engineer the platform without authorization.' },
    ],
  },
  {
    key: 's11',
    title: '11. Termination',
    blocks: [
      { kind: 'p', text: 'We may suspend or terminate access if users violate these Terms.' },
      { kind: 'p', text: 'Users may terminate their accounts at any time.' },
      { kind: 'p', text: 'Upon termination:' },
      {
        kind: 'ul',
        items: [
          'access to the platform may be discontinued',
          'stored data may be deleted in accordance with retention policies',
        ],
      },
    ],
  },
  {
    key: 's12',
    title: '12. Limitation of Liability',
    blocks: [
      { kind: 'p', text: 'To the maximum extent permitted by law, iPrego Pte. Ltd. shall not be liable for:' },
      {
        kind: 'ul',
        items: [
          'indirect or consequential damages',
          'loss of profits or revenue',
          'business interruption',
          'loss of data caused by user actions',
        ],
      },
    ],
  },
  {
    key: 's13',
    title: '13. Governing Law',
    blocks: [
      { kind: 'p', text: 'These Terms are governed by the laws of Singapore.' },
      { kind: 'p', text: 'Any disputes shall be subject to the exclusive jurisdiction of the courts of Singapore.' },
    ],
  },
  {
    key: 's14',
    title: '14. Updates',
    blocks: [
      { kind: 'p', text: 'We may update these Terms periodically.' },
      { kind: 'p', text: 'Continued use of the platform after updates constitutes acceptance of the revised Terms.' },
    ],
  },
]

const privacySections = [
  {
    key: 'p01',
    title: '1. Introduction',
    blocks: [
      { kind: 'p', text: 'This Privacy Policy explains how iPrego Pte. Ltd. collects, uses, discloses, and protects personal data in accordance with the Singapore Personal Data Protection Act (PDPA).' },
      { kind: 'p', text: 'By using the {brand} platform, you consent to the practices described in this policy.' },
    ],
  },
  {
    key: 'p02',
    title: '2. Personal Data We Collect',
    blocks: [
      { kind: 'p', text: 'We may collect personal data including account information (name, email, company, contact), usage information (login records, device data, activity logs), and customer business data uploaded to the platform (employee records, financial and operational data).' },
      { kind: 'p', text: 'This data is processed as part of providing the platform services.' },
    ],
  },
  {
    key: 'p03',
    title: '3. Purpose of Data Collection',
    blocks: [
      { kind: 'p', text: 'Personal data may be used for the following purposes:' },
      {
        kind: 'ul',
        items: [
          'providing and operating the {brand} platform',
          'verifying user identity',
          'providing customer support',
          'improving service performance',
          'maintaining platform security',
          'complying with legal obligations',
        ],
      },
    ],
  },
  {
    key: 'p04',
    title: '4. Consent',
    blocks: [
      { kind: 'p', text: 'By providing personal data, users consent to its collection and use for the purposes described in this policy.' },
      { kind: 'p', text: 'Users may withdraw consent where permitted under PDPA by contacting us.' },
      { kind: 'p', text: 'Withdrawal of consent may affect the ability to use certain services.' },
    ],
  },
  {
    key: 'p05',
    title: '5. Disclosure of Personal Data',
    blocks: [
      { kind: 'p', text: 'We may disclose personal data to:' },
      {
        kind: 'ul',
        items: [
          'service providers assisting with platform operations',
          'infrastructure providers and hosting services',
          'professional advisors where necessary',
          'regulatory authorities where required by law',
        ],
      },
      { kind: 'p', text: 'Such parties are required to maintain confidentiality and data protection standards.' },
    ],
  },
  {
    key: 'p06',
    title: '6. Data Protection Measures',
    blocks: [
      { kind: 'p', text: 'We implement reasonable security arrangements including:' },
      {
        kind: 'ul',
        items: ['encrypted data transmission', 'secure infrastructure', 'access control mechanisms', 'system monitoring'],
      },
      { kind: 'p', text: 'These measures help protect personal data against unauthorized access or disclosure.' },
    ],
  },
  {
    key: 'p07',
    title: '7. Data Retention',
    blocks: [
      { kind: 'p', text: 'Personal data is retained only as long as necessary to fulfill the purposes for which it was collected or as required by law.' },
      { kind: 'p', text: 'Customers may request deletion of personal data where applicable.' },
    ],
  },
  {
    key: 'p08',
    title: '8. Access and Correction',
    blocks: [
      { kind: 'p', text: 'Under the PDPA, individuals may request:' },
      { kind: 'ul', items: ['access to their personal data', 'correction of inaccurate data'] },
      { kind: 'p', text: 'Requests may be submitted to our Data Protection Officer.' },
    ],
  },
  {
    key: 'p09',
    title: '9. International Data Transfers',
    blocks: [
      { kind: 'p', text: 'As a cloud-based service, personal data may be processed outside Singapore.' },
      { kind: 'p', text: 'Where this occurs, we ensure appropriate safeguards are in place to maintain PDPA standards.' },
    ],
  },
  {
    key: 'p10',
    title: '10. Data Protection Officer',
    blocks: [
      { kind: 'p', text: 'In accordance with PDPA requirements, iPrego Pte. Ltd. has appointed a Data Protection Officer (DPO).' },
      { kind: 'p', text: 'For privacy inquiries or requests, email {privacy_email_dpo}. Company: {legal_company}. Location: {legal_location}.' },
    ],
  },
  {
    key: 'p11',
    title: '11. Updates to this Policy',
    blocks: [
      { kind: 'p', text: 'This Privacy Policy may be updated periodically.' },
      { kind: 'p', text: 'The latest version will always be published on our website.' },
    ],
  },
]

const cookieSections = [
  { key: 'c01', title: '1. Introduction', blocks: [{ kind: 'p', text: 'This Cookie Policy explains how iPrego Pte. Ltd. uses cookies and similar technologies when users access the {brand} website or platform.' }] },
  { key: 'c02', title: '2. What Are Cookies', blocks: [{ kind: 'p', text: "Cookies are small text files stored on a user's device when visiting a website." }, { kind: 'p', text: 'They help improve website functionality and user experience.' }] },
  {
    key: 'c03',
    title: '3. Types of Cookies We Use',
    blocks: [
      { kind: 'p', text: 'Essential cookies — required for platform operation (authentication, session, security).' },
      { kind: 'ul', items: ['authentication cookies', 'session management', 'security controls'] },
      { kind: 'p', text: 'Analytics cookies — used to understand platform usage (page statistics, performance).' },
      { kind: 'ul', items: ['page usage statistics', 'performance monitoring'] },
      { kind: 'p', text: 'Preference cookies — remember user settings such as language and interface configuration.' },
      { kind: 'ul', items: ['language preferences', 'interface configuration'] },
    ],
  },
  { key: 'c04', title: '4. Managing Cookies', blocks: [{ kind: 'p', text: 'Users may control cookies through browser settings.' }, { kind: 'p', text: 'Disabling cookies may affect certain platform features.' }] },
  { key: 'c05', title: '5. Updates', blocks: [{ kind: 'p', text: 'This Cookie Policy may be updated from time to time to reflect changes in technology or regulations.' }] },
  {
    key: 'c06',
    title: 'Contact',
    blocks: [
      { kind: 'p', text: 'For legal or privacy matters:' },
      { kind: 'p', text: '{legal_company}, {legal_location}. Email: {support_email} or {privacy_email_dpa}.' },
    ],
  },
]

const slaSections = [
  { key: 'sla01', title: '1. Introduction', blocks: [{ kind: 'p', text: 'This Service Level Agreement ("SLA") describes service availability and support policies for the {brand} platform provided by iPrego Pte. Ltd., Singapore.' }, { kind: 'p', text: 'This SLA applies to customers with a valid {brand} subscription.' }] },
  { key: 'sla02', title: '2. Scope of Services', blocks: [{ kind: 'p', text: '{brand} is a cloud SaaS platform providing ERP, accounting, HR, CRM, analytics, and workflow automation.' }, { kind: 'ul', items: ['Enterprise Resource Planning (ERP)', 'Accounting and finance automation', 'Human resource management', 'Customer relationship management (CRM)', 'Business analytics and reporting', 'Workflow automation'] }] },
  { key: 'sla03', title: '3. Service Availability', blocks: [{ kind: 'p', text: 'Target availability: 99.9% monthly uptime, measured as platform accessibility.' }, { kind: 'ul', items: ['scheduled maintenance', 'emergency maintenance', 'force majeure events', 'internet disruptions outside our infrastructure', 'third-party integration issues', 'user misconfiguration or misuse'] }] },
  { key: 'sla04', title: '4. Scheduled Maintenance', blocks: [{ kind: 'p', text: 'Maintenance may occur during low-traffic periods with advance notice where possible.' }] },
  { key: 'sla05', title: '5. Incident Management', blocks: [{ kind: 'p', text: 'Incidents are categorized by severity with response targets from 1 hour (critical) to 2 business days (low).' }] },
  { key: 'sla06', title: '6. Support Channels', blocks: [{ kind: 'ul', items: ['email support', 'customer support portal', 'designated enterprise support channels'] }, { kind: 'p', text: 'Support hours vary by subscription plan.' }] },
  { key: 'sla07', title: '7. Data Backup and Recovery', blocks: [{ kind: 'p', text: '{brand} maintains automated backups and recovery procedures; schedules may vary by operational requirements.' }] },
  { key: 'sla08', title: '8. Security and Monitoring', blocks: [{ kind: 'p', text: 'Operational monitoring, alerts, performance tracking, and access controls help maintain stability and security.' }] },
  { key: 'sla09', title: '9. Service Credits', blocks: [{ kind: 'p', text: 'If uptime falls below committed levels, customers may request subscription credits within 30 days of the incident.' }, { kind: 'ul', items: ['99.0%–99.9%: 5% credit', '95.0%–98.9%: 10% credit', 'Below 95%: 20% credit'] }] },
  { key: 'sla10', title: '10. Customer Responsibilities', blocks: [{ kind: 'ul', items: ['maintaining secure login credentials', 'configuring the platform appropriately', 'compliance with applicable laws', 'maintaining internet connectivity'] }] },
  { key: 'sla11', title: '11. Changes to the SLA', blocks: [{ kind: 'p', text: 'Material SLA changes will be communicated through official channels.' }] },
  { key: 'sla12', title: '12. Governing Law', blocks: [{ kind: 'p', text: 'This SLA is governed by the laws of Singapore.' }, { kind: 'p', text: 'Disputes are subject to the jurisdiction of the courts of Singapore.' }] },
  { key: 'sla13', title: 'Contact', blocks: [{ kind: 'p', text: 'SLA inquiries: contact support via the email published on our website.' }] },
]

const raiSections = [
  { key: 'rai01', title: '1. Introduction', blocks: [{ kind: 'p', text: 'This policy describes how iPrego Pte. Ltd. designs and operates assisted and automated capabilities in the {brand} platform with transparency, accountability, and data protection.' }] },
  { key: 'rai02', title: '2. Purpose within the {brand} platform', blocks: [{ kind: 'p', text: 'Assisted capabilities support productivity — financial insights, classification, workforce analytics, pipeline analysis, workflow recommendations, and forecasting. They assist decision-making; they do not replace human oversight.' }] },
  { key: 'rai03', title: '3. Human oversight', blocks: [{ kind: 'p', text: 'Users remain responsible for reviewing financial decisions, HR actions, workflows, and automated recommendations.' }] },
  { key: 'rai04', title: '4. Data protection and privacy', blocks: [{ kind: 'p', text: 'Customer data remains under customer ownership, is processed only for platform functionality, and follows Singapore PDPA. Customer data is not used to train shared foundation models without explicit consent.' }] },
  { key: 'rai05', title: '5. Transparency', blocks: [{ kind: 'p', text: 'Users are informed when insights, recommendations, or automated workflows are machine-assisted.' }] },
  { key: 'rai06', title: '6. Fairness and responsible use', blocks: [{ kind: 'p', text: 'Do not use automated suggestions for unfair treatment or discrimination. Organizations must comply with applicable laws.' }] },
  { key: 'rai07', title: '7. Security', blocks: [{ kind: 'p', text: 'Assisted features are protected by access controls, secure infrastructure, monitoring, and unauthorized-access safeguards.' }] },
  { key: 'rai08', title: '8. Continuous improvement', blocks: [{ kind: 'p', text: 'Capabilities may improve through product updates, performance monitoring, and user feedback.' }] },
  { key: 'rai09', title: '9. Limitations', blocks: [{ kind: 'p', text: 'Outputs may be inaccurate; predictions may not reflect outcomes; recommendations require contextual interpretation and human judgment.' }] },
  { key: 'rai10', title: '10. Reporting concerns', blocks: [{ kind: 'p', text: 'Report incorrect outputs, unexpected behavior, or potential misuse to iPrego Pte. Ltd. for review.' }] },
  { key: 'rai11', title: '11. Updates to this policy', blocks: [{ kind: 'p', text: 'This policy may be updated periodically; the latest version is published on the {brand} website.' }] },
  { key: 'rai12', title: 'Contact', blocks: [{ kind: 'p', text: 'Governance questions: contact support via the email published on our website.' }] },
]

const COMPARE_FEATURES = [
  { featureKey: 'infra_users', feature: 'Users' },
  { featureKey: 'infra_db_gb', feature: 'DB (GB)' },
  { featureKey: 'infra_file_gb', feature: 'File (GB)' },
  { featureKey: 'infra_app_ram', feature: 'App RAM (logical)' },
  { featureKey: 'infra_db_ram_share', feature: 'DB RAM Share' },
  { featureKey: 'infra_redis_share', feature: 'Redis Share' },
  { featureKey: 'infra_tier', feature: 'Infra Tier' },
  { featureKey: 'acct_accounting', feature: 'Accounting' },
  { featureKey: 'acct_bookkeeping', feature: 'Bookkeeping' },
  { featureKey: 'acct_invoice', feature: 'Invoice' },
  { featureKey: 'acct_auto_image_scan', feature: 'Auto Image scan (Invoice, Receipt)' },
  { featureKey: 'hr_attendance_leave', feature: 'Attendance/Leave' },
  { featureKey: 'hr_payroll', feature: 'Payroll' },
  { featureKey: 'crm_sales_management', feature: 'Sales management' },
  { featureKey: 'email_send_communicate', feature: 'Send & communicate' },
  { featureKey: 'support_technical', feature: 'Technical support' },
  { featureKey: 'support_i18n', feature: 'Internationalization' },
  { featureKey: 'support_remove_branding', feature: 'Remove branding' },
  { featureKey: 'support_early_access', feature: 'Early access to new features' },
  { featureKey: 'support_attack_protection', feature: 'Attack protection' },
  { featureKey: 'support_mfa', feature: 'Multi-Factor Authentication' },
]

function compareFeatKeys(translations = {}) {
  const keys = {}
  for (const row of COMPARE_FEATURES) {
    const id = `compare_feat_${row.featureKey}`
    keys[id] = translations[row.featureKey] ?? row.feature
  }
  return keys
}

// ── Patch EN sources ─────────────────────────────────────────────────────────

const enTermsKeys = flattenSections(termsSections)
const enPrivacyKeys = flattenSections(privacySections)
const enCookieKeys = flattenSections(cookieSections)
const enSlaKeys = flattenSections(slaSections)
const enRaiKeys = flattenSections(raiSections)

removeKeysMatching('sources/en/www/cookie-policy.page.json', /^c03_li\d+$/)
removeKeysMatching('sources/en/www/sla.page.json', /^sla\d+_li\d+$/)

countMerge('sources/en/www/terms.page.json', enTermsKeys)
countMerge('sources/en/www/privacy.page.json', enPrivacyKeys)
countMerge('sources/en/www/cookie-policy.page.json', enCookieKeys)
countMerge('sources/en/www/sla.page.json', enSlaKeys)
countMerge('sources/en/www/responsible-ai.page.json', enRaiKeys)

const enCompareFeat = compareFeatKeys()
countMerge('sources/en/www/pricing.page.json', enCompareFeat)

function titleOnlyKeys(sectionTitles) {
  const out = {}
  for (const { key, title } of sectionTitles) out[`${key}_title`] = title
  return out
}

// ── Korean (full legal body) ─────────────────────────────────────────────────

const koTermsSections = [
  { key: 's01', title: '1. 소개', blocks: [{ kind: 'p', text: '본 서비스 이용약관("약관")은 싱가포르 법인 iPrego Pte. Ltd.가 제공하는 {brand} 플랫폼 및 관련 서비스의 접근 및 이용을 규정합니다.' }, { kind: 'p', text: '{brand} 플랫폼에 접근하거나 이용하면 본 약관에 동의하는 것으로 간주됩니다.' }, { kind: 'p', text: '본 약관에 동의하지 않으면 서비스를 이용할 수 없습니다.' }] },
  { key: 's02', title: '2. 서비스 소개', blocks: [{ kind: 'p', text: '{brand}는 다음을 포함하는 통합 비즈니스 소프트웨어 솔루션을 제공하는 클라우드 기반 SaaS 플랫폼입니다.' }, { kind: 'ul', items: ['전사적 자원 관리(ERP)', '회계 및 재무 자동화', '인적 자원 관리', '고객 관계 관리(CRM)', '비즈니스 분석 및 보고', '워크플로 자동화'] }, { kind: 'p', text: '서비스는 iPrego Pte. Ltd.가 운영하는 웹 기반 애플리케이션을 통해 제공됩니다.' }] },
  { key: 's03', title: '3. 이용 자격', blocks: [{ kind: 'p', text: '{brand} 플랫폼을 이용하려면 만 18세 이상이며 구속력 있는 계약을 체결할 법적 능력이 있어야 합니다.' }, { kind: 'p', text: '조직을 대표하여 서비스를 이용하는 경우, 해당 조직을 본 약관에 구속할 권한이 있음을 확인합니다.' }] },
  { key: 's04', title: '4. 사용자 계정', blocks: [{ kind: 'p', text: '일부 서비스에 접근하려면 계정을 생성해야 합니다.' }, { kind: 'p', text: '귀하는 다음에 동의합니다.' }, { kind: 'ul', items: ['정확한 정보 제공', '로그인 자격 증명의 기밀 유지', '계정의 무단 사용을 즉시 당사에 통지(연락처: {support_email})'] }, { kind: 'p', text: '사용자는 본인 계정을 통해 수행되는 모든 활동에 대한 책임을 집니다.' }] },
  { key: 's05', title: '5. 허용 가능한 이용', blocks: [{ kind: 'p', text: '사용자는 다음과 같은 방식으로 플랫폼을 이용해서는 안 됩니다.' }, { kind: 'ul', items: ['적용 법률 또는 규정 위반', '지적 재산권 침해', '시스템에 대한 무단 접근 시도', '플랫폼의 보안 또는 성능 방해', '악성 소프트웨어 배포'] }, { kind: 'p', text: 'iPrego Pte. Ltd.는 서비스 오용 시 계정을 정지하거나 해지할 권리를 보유합니다.' }] },
  { key: 's06', title: '6. 고객 데이터', blocks: [{ kind: 'p', text: '고객은 플랫폼에 업로드한 모든 데이터의 소유권을 보유합니다.' }, { kind: 'p', text: 'iPrego Pte. Ltd.는 고객을 대신하여 개인정보를 처리할 때 싱가포르 PDPA에 따른 데이터 중개자 역할을 합니다.' }, { kind: 'p', text: '당사는 플랫폼 서비스 제공 목적으로만 해당 데이터를 처리합니다.' }, { kind: 'p', text: '고객은 자신의 데이터 수집 및 이용이 적용 법률을 준수하도록 할 책임이 있습니다.' }] },
  { key: 's07', title: '7. 보조 및 자동화 기능', blocks: [{ kind: 'p', text: '{brand} 플랫폼에는 비즈니스 운영을 지원하기 위한 보조 및 자동화 기능이 포함될 수 있습니다.' }, { kind: 'p', text: '시스템 생성 결과물은:' }, { kind: 'ul', items: ['정보 제공 목적으로만 제공됩니다', '사용자 확인이 필요할 수 있습니다', '전문적 조언으로 의존해서는 안 됩니다'] }, { kind: 'p', text: '사용자는 자동화 또는 제안된 결정을 실행하기 전에 검토할 책임이 있습니다.' }] },
  { key: 's08', title: '8. 요금 및 구독', blocks: [{ kind: 'p', text: '플랫폼의 일부 기능은 유료 구독이 필요합니다.' }, { kind: 'p', text: '고객은 다음에 동의합니다.' }, { kind: 'ul', items: ['해당 구독 요금 납부', '유효한 결제 정보 유지', '결제 조건 준수'] }, { kind: 'p', text: '갱신일 이전에 취소하지 않으면 구독이 자동으로 갱신될 수 있습니다.' }] },
  { key: 's09', title: '9. 서비스 가용성', blocks: [{ kind: 'p', text: 'iPrego Pte. Ltd.는 안정적인 서비스 가용성을 제공하기 위해 노력합니다.' }, { kind: 'p', text: '다만 다음으로 인해 서비스 중단이 발생할 수 있습니다.' }, { kind: 'ul', items: ['시스템 유지보수', '인프라 업데이트', '예기치 못한 기술적 문제'] }, { kind: 'p', text: '서비스 복구를 위해 합리적인 노력을 기울입니다.' }] },
  { key: 's10', title: '10. 지적 재산권', blocks: [{ kind: 'p', text: '{brand} 플랫폼의 소프트웨어, 디자인, 콘텐츠를 포함한 모든 권리는 iPrego Pte. Ltd. 또는 해당 라이선스 제공자에게 있습니다.' }, { kind: 'p', text: '사용자에게는 플랫폼에 접근하고 이용할 수 있는 제한적, 비독점적, 양도 불가능한 라이선스가 부여됩니다.' }, { kind: 'p', text: '사용자는 승인 없이 플랫폼을 복사, 수정, 배포 또는 리버스 엔지니어링할 수 없습니다.' }] },
  { key: 's11', title: '11. 해지', blocks: [{ kind: 'p', text: '사용자가 본 약관을 위반하는 경우 접근을 정지하거나 해지할 수 있습니다.' }, { kind: 'p', text: '사용자는 언제든지 계정을 해지할 수 있습니다.' }, { kind: 'p', text: '해지 시:' }, { kind: 'ul', items: ['플랫폼 접근이 중단될 수 있습니다', '저장된 데이터는 보존 정책에 따라 삭제될 수 있습니다'] }] },
  { key: 's12', title: '12. 책임의 한계', blocks: [{ kind: 'p', text: '법률이 허용하는 최대 범위 내에서 iPrego Pte. Ltd.는 다음에 대해 책임을 지지 않습니다.' }, { kind: 'ul', items: ['간접적 또는 결과적 손해', '이익 또는 수익 손실', '사업 중단', '사용자 행위로 인한 데이터 손실'] }] },
  { key: 's13', title: '13. 준거법', blocks: [{ kind: 'p', text: '본 약관은 싱가포르 법률의 적용을 받습니다.' }, { kind: 'p', text: '모든 분쟁은 싱가포르 법원의 전속 관할에 따릅니다.' }] },
  { key: 's14', title: '14. 업데이트', blocks: [{ kind: 'p', text: '당사는 본 약관을 수시로 업데이트할 수 있습니다.' }, { kind: 'p', text: '업데이트 후 플랫폼을 계속 이용하면 개정된 약관에 동의한 것으로 간주됩니다.' }] },
]

const koPrivacySections = [
  { key: 'p01', title: '1. 소개', blocks: [{ kind: 'p', text: '본 개인정보 처리방침은 iPrego Pte. Ltd.가 싱가포르 개인정보 보호법(PDPA)에 따라 개인정보를 수집, 이용, 공개 및 보호하는 방법을 설명합니다.' }, { kind: 'p', text: '{brand} 플랫폼을 이용하면 본 방침에 설명된 관행에 동의하는 것으로 간주됩니다.' }] },
  { key: 'p02', title: '2. 수집하는 개인정보', blocks: [{ kind: 'p', text: '당사는 계정 정보(이름, 이메일, 회사, 연락처), 이용 정보(로그인 기록, 기기 데이터, 활동 로그), 플랫폼에 업로드된 고객 비즈니스 데이터(직원 기록, 재무 및 운영 데이터) 등의 개인정보를 수집할 수 있습니다.' }, { kind: 'p', text: '해당 데이터는 플랫폼 서비스 제공의 일부로 처리됩니다.' }] },
  { key: 'p03', title: '3. 수집 목적', blocks: [{ kind: 'p', text: '개인정보는 다음 목적으로 이용될 수 있습니다.' }, { kind: 'ul', items: ['{brand} 플랫폼 제공 및 운영', '사용자 신원 확인', '고객 지원 제공', '서비스 성능 개선', '플랫폼 보안 유지', '법적 의무 준수'] }] },
  { key: 'p04', title: '4. 동의', blocks: [{ kind: 'p', text: '개인정보를 제공함으로써 사용자는 본 방침에 설명된 목적에 따른 수집 및 이용에 동의합니다.' }, { kind: 'p', text: 'PDPA에서 허용되는 경우 당사에 연락하여 동의를 철회할 수 있습니다.' }, { kind: 'p', text: '동의 철회는 일부 서비스 이용에 영향을 줄 수 있습니다.' }] },
  { key: 'p05', title: '5. 개인정보 제공', blocks: [{ kind: 'p', text: '당사는 개인정보를 다음 주체에 공개할 수 있습니다.' }, { kind: 'ul', items: ['플랫폼 운영을 지원하는 서비스 제공업체', '인프라 및 호스팅 서비스 제공업체', '필요한 경우 전문 자문인', '법률에 따라 요구되는 규제 기관'] }, { kind: 'p', text: '해당 당사자는 기밀 유지 및 데이터 보호 기준을 준수해야 합니다.' }] },
  { key: 'p06', title: '6. 데이터 보호 조치', blocks: [{ kind: 'p', text: '당사는 다음을 포함한 합리적인 보안 조치를 시행합니다.' }, { kind: 'ul', items: ['암호화된 데이터 전송', '안전한 인프라', '접근 통제 메커니즘', '시스템 모니터링'] }, { kind: 'p', text: '이러한 조치는 무단 접근 또는 공개로부터 개인정보를 보호하는 데 도움이 됩니다.' }] },
  { key: 'p07', title: '7. 데이터 보존', blocks: [{ kind: 'p', text: '개인정보는 수집 목적을 달성하거나 법률에서 요구하는 기간 동안만 보존됩니다.' }, { kind: 'p', text: '고객은 해당되는 경우 개인정보 삭제를 요청할 수 있습니다.' }] },
  { key: 'p08', title: '8. 열람 및 정정', blocks: [{ kind: 'p', text: 'PDPA에 따라 개인은 다음을 요청할 수 있습니다.' }, { kind: 'ul', items: ['본인 개인정보에 대한 열람', '부정확한 데이터의 정정'] }, { kind: 'p', text: '요청은 개인정보 보호 책임자에게 제출할 수 있습니다.' }] },
  { key: 'p09', title: '9. 국외 이전', blocks: [{ kind: 'p', text: '클라우드 기반 서비스로서 개인정보는 싱가포르 외부에서 처리될 수 있습니다.' }, { kind: 'p', text: '이 경우 PDPA 기준을 유지하기 위한 적절한 보호 조치를 마련합니다.' }] },
  { key: 'p10', title: '10. 개인정보 보호 책임자', blocks: [{ kind: 'p', text: 'PDPA 요건에 따라 iPrego Pte. Ltd.는 개인정보 보호 책임자(DPO)를 지정하였습니다.' }, { kind: 'p', text: '개인정보 관련 문의 또는 요청은 {privacy_email_dpo}로 이메일을 보내 주십시오. 회사: {legal_company}. 소재지: {legal_location}.' }] },
  { key: 'p11', title: '11. 방침 업데이트', blocks: [{ kind: 'p', text: '본 개인정보 처리방침은 수시로 업데이트될 수 있습니다.' }, { kind: 'p', text: '최신 버전은 항상 당사 웹사이트에 게시됩니다.' }] },
]

const koCookieSections = [
  { key: 'c01', title: '1. 소개', blocks: [{ kind: 'p', text: '본 쿠키 정책은 iPrego Pte. Ltd.가 {brand} 웹사이트 또는 플랫폼에 접근할 때 쿠키 및 유사 기술을 어떻게 사용하는지 설명합니다.' }] },
  { key: 'c02', title: '2. 쿠키란', blocks: [{ kind: 'p', text: '쿠키는 웹사이트 방문 시 사용자 기기에 저장되는 작은 텍스트 파일입니다.' }, { kind: 'p', text: '웹사이트 기능 및 사용자 경험 개선에 도움이 됩니다.' }] },
  { key: 'c03', title: '3. 사용하는 쿠키 유형', blocks: [{ kind: 'p', text: '필수 쿠키 — 플랫폼 운영에 필요(인증, 세션, 보안).' }, { kind: 'ul', items: ['인증 쿠키', '세션 관리', '보안 통제'] }, { kind: 'p', text: '분석 쿠키 — 플랫폼 이용 현황 파악(페이지 통계, 성능).' }, { kind: 'ul', items: ['페이지 이용 통계', '성능 모니터링'] }, { kind: 'p', text: '환경설정 쿠키 — 언어 및 인터페이스 설정 등 사용자 설정 기억.' }, { kind: 'ul', items: ['언어 환경설정', '인터페이스 구성'] }] },
  { key: 'c04', title: '4. 쿠키 관리', blocks: [{ kind: 'p', text: '브라우저 설정을 통해 쿠키를 제어할 수 있습니다.' }, { kind: 'p', text: '쿠키를 비활성화하면 일부 플랫폼 기능에 영향을 줄 수 있습니다.' }] },
  { key: 'c05', title: '5. 업데이트', blocks: [{ kind: 'p', text: '기술 또는 규제 변경을 반영하기 위해 본 쿠키 정책이 수시로 업데이트될 수 있습니다.' }] },
  { key: 'c06', title: '문의', blocks: [{ kind: 'p', text: '법률 또는 개인정보 관련 문의:' }, { kind: 'p', text: '{legal_company}, {legal_location}. 이메일: {support_email} 또는 {privacy_email_dpa}.' }] },
]

const koSlaSections = [
  { key: 'sla01', title: '1. 소개', blocks: [{ kind: 'p', text: '본 서비스 수준 협약("SLA")은 싱가포르 iPrego Pte. Ltd.가 제공하는 {brand} 플랫폼의 서비스 가용성 및 지원 정책을 설명합니다.' }, { kind: 'p', text: '본 SLA는 유효한 {brand} 구독을 보유한 고객에게 적용됩니다.' }] },
  { key: 'sla02', title: '2. 서비스 범위', blocks: [{ kind: 'p', text: '{brand}는 ERP, 회계, HR, CRM, 분석 및 워크플로 자동화를 제공하는 클라우드 SaaS 플랫폼입니다.' }, { kind: 'ul', items: ['전사적 자원 관리(ERP)', '회계 및 재무 자동화', '인적 자원 관리', '고객 관계 관리(CRM)', '비즈니스 분석 및 보고', '워크플로 자동화'] }] },
  { key: 'sla03', title: '3. 서비스 가용성', blocks: [{ kind: 'p', text: '목표 가용성: 플랫폼 접근성 기준 월 99.9% 업타임.' }, { kind: 'ul', items: ['예정된 유지보수', '긴급 유지보수', '불가항력 사건', '당사 인프라 외부의 인터넷 장애', '제3자 연동 문제', '사용자 설정 오류 또는 오용'] }] },
  { key: 'sla04', title: '4. 예정 유지보수', blocks: [{ kind: 'p', text: '가능한 경우 사전 통지와 함께 이용량이 적은 시간대에 유지보수가 진행될 수 있습니다.' }] },
  { key: 'sla05', title: '5. 사고 관리', blocks: [{ kind: 'p', text: '사고는 심각도에 따라 분류되며, 대응 목표는 1시간(치명적)부터 2영업일(낮음)까지입니다.' }] },
  { key: 'sla06', title: '6. 지원 채널', blocks: [{ kind: 'ul', items: ['이메일 지원', '고객 지원 포털', '지정된 엔터프라이즈 지원 채널'] }, { kind: 'p', text: '지원 시간은 구독 플랜에 따라 다릅니다.' }] },
  { key: 'sla07', title: '7. 데이터 백업 및 복구', blocks: [{ kind: 'p', text: '{brand}는 자동 백업 및 복구 절차를 유지하며, 일정은 운영 요건에 따라 달라질 수 있습니다.' }] },
  { key: 'sla08', title: '8. 보안 및 모니터링', blocks: [{ kind: 'p', text: '운영 모니터링, 알림, 성능 추적 및 접근 통제는 안정성과 보안 유지에 도움이 됩니다.' }] },
  { key: 'sla09', title: '9. 서비스 크레딧', blocks: [{ kind: 'p', text: '업타임이 약정 수준 미만인 경우 고객은 사고 발생 후 30일 이내에 구독 크레딧을 요청할 수 있습니다.' }, { kind: 'ul', items: ['99.0%–99.9%: 5% 크레딧', '95.0%–98.9%: 10% 크레딧', '95% 미만: 20% 크레딧'] }] },
  { key: 'sla10', title: '10. 고객 책임', blocks: [{ kind: 'ul', items: ['안전한 로그인 자격 증명 유지', '플랫폼 적절한 구성', '적용 법률 준수', '인터넷 연결 유지'] }] },
  { key: 'sla11', title: '11. SLA 변경', blocks: [{ kind: 'p', text: '중대한 SLA 변경은 공식 채널을 통해 통지됩니다.' }] },
  { key: 'sla12', title: '12. 준거법', blocks: [{ kind: 'p', text: '본 SLA는 싱가포르 법률의 적용을 받습니다.' }, { kind: 'p', text: '분쟁은 싱가포르 법원의 관할에 따릅니다.' }] },
  { key: 'sla13', title: '문의', blocks: [{ kind: 'p', text: 'SLA 문의: 웹사이트에 게시된 이메일을 통해 지원팀에 연락하십시오.' }] },
]

const koRaiSections = [
  { key: 'rai01', title: '1. 소개', blocks: [{ kind: 'p', text: '본 정책은 iPrego Pte. Ltd.가 {brand} 플랫폼의 보조 및 자동화 기능을 투명성, 책임감 및 데이터 보호 원칙에 따라 설계·운영하는 방법을 설명합니다.' }] },
  { key: 'rai02', title: '2. {brand} 플랫폼 내 목적', blocks: [{ kind: 'p', text: '보조 기능은 재무 인사이트, 분류, 인력 분석, 파이프라인 분석, 워크플로 권장 및 예측 등 생산성을 지원합니다. 의사결정을 보조하며 인간의 감독을 대체하지 않습니다.' }] },
  { key: 'rai03', title: '3. 인간 감독', blocks: [{ kind: 'p', text: '사용자는 재무 결정, HR 조치, 워크플로 및 자동화 권장 사항을 검토할 책임이 있습니다.' }] },
  { key: 'rai04', title: '4. 데이터 보호 및 개인정보', blocks: [{ kind: 'p', text: '고객 데이터는 고객 소유이며 플랫폼 기능 목적으로만 처리되고 싱가포르 PDPA를 따릅니다. 명시적 동의 없이 공유 기초 모델 학습에 사용되지 않습니다.' }] },
  { key: 'rai05', title: '5. 투명성', blocks: [{ kind: 'p', text: '인사이트, 권장 사항 또는 자동화 워크플로가 기계 보조인 경우 사용자에게 알립니다.' }] },
  { key: 'rai06', title: '6. 공정성 및 책임 있는 이용', blocks: [{ kind: 'p', text: '자동화 제안을 불공정한 대우나 차별에 사용하지 마십시오. 조직은 적용 법률을 준수해야 합니다.' }] },
  { key: 'rai07', title: '7. 보안', blocks: [{ kind: 'p', text: '보조 기능은 접근 통제, 안전한 인프라, 모니터링 및 무단 접근 방지로 보호됩니다.' }] },
  { key: 'rai08', title: '8. 지속적 개선', blocks: [{ kind: 'p', text: '기능은 제품 업데이트, 성능 모니터링 및 사용자 피드백을 통해 개선될 수 있습니다.' }] },
  { key: 'rai09', title: '9. 한계', blocks: [{ kind: 'p', text: '결과물은 부정확할 수 있으며, 예측은 실제 결과를 반영하지 않을 수 있고, 권장 사항은 맥락적 해석과 인간의 판단이 필요합니다.' }] },
  { key: 'rai10', title: '10. 우려 사항 신고', blocks: [{ kind: 'p', text: '잘못된 출력, 예상치 못한 동작 또는 오용 가능성을 iPrego Pte. Ltd.에 신고하여 검토를 요청할 수 있습니다.' }] },
  { key: 'rai11', title: '11. 정책 업데이트', blocks: [{ kind: 'p', text: '본 정책은 수시로 업데이트될 수 있으며, 최신 버전은 {brand} 웹사이트에 게시됩니다.' }] },
  { key: 'rai12', title: '문의', blocks: [{ kind: 'p', text: '거버넌스 관련 문의: 웹사이트에 게시된 이메일을 통해 지원팀에 연락하십시오.' }] },
]

const koCompareFeat = {
  infra_users: '사용자',
  infra_db_gb: 'DB(GB)',
  infra_file_gb: '파일(GB)',
  infra_app_ram: '앱 RAM(논리)',
  infra_db_ram_share: 'DB RAM 공유',
  infra_redis_share: 'Redis 공유',
  infra_tier: '인프라 등급',
  acct_accounting: '회계',
  acct_bookkeeping: '부기',
  acct_invoice: '청구서',
  acct_auto_image_scan: '자동 이미지 스캔(청구서, 영수증)',
  hr_attendance_leave: '근태/휴가',
  hr_payroll: '급여',
  crm_sales_management: '영업 관리',
  email_send_communicate: '발송 및 커뮤니케이션',
  support_technical: '기술 지원',
  support_i18n: '국제화',
  support_remove_branding: '브랜딩 제거',
  support_early_access: '신기능 조기 액세스',
  support_attack_protection: '공격 방어',
  support_mfa: '다중 인증(MFA)',
}

removeKeysMatching('locales/ko/www/cookie-policy.page.json', /^c03_li\d+$/)
removeKeysMatching('locales/ko/www/sla.page.json', /^sla\d+_li\d+$/)

countMerge('locales/ko/www/terms.page.json', { page_title: '서비스 이용약관', page_subtitle: '{brand} 플랫폼 서비스 이용약관', meta_title: '서비스 이용약관', meta_description: '서비스 이용약관.', ...flattenSections(koTermsSections) }, { translationStatus: 'reviewed', method: 'patch-legal-full-body' })
countMerge('locales/ko/www/privacy.page.json', { page_title: '개인정보 처리방침', page_subtitle: 'PDPA 준수 개인정보 처리방침', meta_title: '개인정보 처리방침', meta_description: '개인정보 처리방침 및 PDPA 준수.', ...flattenSections(koPrivacySections) }, { translationStatus: 'reviewed', method: 'patch-legal-full-body' })
countMerge('locales/ko/www/cookie-policy.page.json', { page_title: '쿠키 정책', meta_title: '쿠키 정책', meta_description: '쿠키 정책.', ...flattenSections(koCookieSections) }, { translationStatus: 'reviewed', method: 'patch-legal-full-body' })
countMerge('locales/ko/www/sla.page.json', { page_title: '서비스 수준 협약(SLA)', meta_title: '서비스 수준 협약', meta_description: '서비스 수준 협약.', ...flattenSections(koSlaSections) }, { translationStatus: 'reviewed', method: 'patch-legal-full-body' })
countMerge('locales/ko/www/responsible-ai.page.json', { page_title: '책임 있는 이용 정책', meta_title: '책임 있는 이용 정책', meta_description: '책임 있는 AI 이용 정책.', ...flattenSections(koRaiSections) }, { translationStatus: 'reviewed', method: 'patch-legal-full-body' })
countMerge('locales/ko/www/pricing.page.json', compareFeatKeys(koCompareFeat), { translationStatus: 'reviewed', method: 'patch-legal-full-body' })

// ── Japanese (titles all pages; body terms s01–s03, privacy p01–p03, cookie c01–c03) ─

const jaTermsSections = [
  { key: 's01', title: '1. はじめに', blocks: [{ kind: 'p', text: '本サービス利用規約（「規約」）は、シンガポール法人 iPrego Pte. Ltd. が提供する {brand} プラットフォームおよび関連サービスへのアクセスおよび利用を規定します。' }, { kind: 'p', text: '{brand} プラットフォームにアクセスまたは利用することにより、本規約に拘束されることに同意したものとみなされます。' }, { kind: 'p', text: '本規約に同意しない場合は、本サービスを利用してはなりません。' }] },
  { key: 's02', title: '2. サービスについて', blocks: [{ kind: 'p', text: '{brand} は、以下を含む統合ビジネスソフトウェアソリューションを提供するクラウドベースの SaaS プラットフォームです。' }, { kind: 'ul', items: ['エンタープライズリソースプランニング（ERP）', '会計および財務自動化', '人事管理', '顧客関係管理（CRM）', 'ビジネス分析およびレポート', 'ワークフロー自動化'] }, { kind: 'p', text: 'サービスは iPrego Pte. Ltd. が運営する Web アプリケーションを通じて提供されます。' }] },
  { key: 's03', title: '3. 利用資格', blocks: [{ kind: 'p', text: '{brand} プラットフォームを利用するには、18 歳以上であり、拘束力のある契約を締結する法的能力が必要です。' }, { kind: 'p', text: '組織を代表してサービスを利用する場合、当該組織を本規約に拘束する権限があることを確認します。' }] },
  { key: 's04', title: '4. ユーザーアカウント' },
  { key: 's05', title: '5. 許容される利用' },
  { key: 's06', title: '6. 顧客データ' },
  { key: 's07', title: '7. 支援および自動化機能' },
  { key: 's08', title: '8. 料金およびサブスクリプション' },
  { key: 's09', title: '9. サービス可用性' },
  { key: 's10', title: '10. 知的財産権' },
  { key: 's11', title: '11. 解約' },
  { key: 's12', title: '12. 責任の制限' },
  { key: 's13', title: '13. 準拠法' },
  { key: 's14', title: '14. 更新' },
]

const jaPrivacySections = [
  { key: 'p01', title: '1. はじめに', blocks: [{ kind: 'p', text: '本プライバシーポリシーは、iPrego Pte. Ltd. がシンガポール個人データ保護法（PDPA）に従い個人データを収集、利用、開示、保護する方法を説明します。' }, { kind: 'p', text: '{brand} プラットフォームを利用することにより、本ポリシーに記載された取扱いに同意したものとみなされます。' }] },
  { key: 'p02', title: '2. 収集する個人データ', blocks: [{ kind: 'p', text: '当社は、アカウント情報（氏名、メール、会社、連絡先）、利用情報（ログイン記録、デバイスデータ、活動ログ）、プラットフォームにアップロードされた顧客ビジネスデータ（従業員記録、財務および運用データ）などの個人データを収集する場合があります。' }, { kind: 'p', text: 'これらのデータはプラットフォームサービス提供の一環として処理されます。' }] },
  { key: 'p03', title: '3. データ収集の目的', blocks: [{ kind: 'p', text: '個人データは以下の目的で利用される場合があります。' }, { kind: 'ul', items: ['{brand} プラットフォームの提供および運営', 'ユーザー本人確認', 'カスタマーサポートの提供', 'サービス性能の改善', 'プラットフォームセキュリティの維持', '法的義務の遵守'] }] },
  { key: 'p04', title: '4. 同意' },
  { key: 'p05', title: '5. 個人データの開示' },
  { key: 'p06', title: '6. データ保護措置' },
  { key: 'p07', title: '7. データ保持' },
  { key: 'p08', title: '8. アクセスおよび訂正' },
  { key: 'p09', title: '9. 国際データ移転' },
  { key: 'p10', title: '10. データ保護責任者' },
  { key: 'p11', title: '11. 本ポリシーの更新' },
]

const jaCookieSections = [
  { key: 'c01', title: '1. はじめに', blocks: [{ kind: 'p', text: '本クッキーポリシーは、iPrego Pte. Ltd. が {brand} ウェブサイトまたはプラットフォームへのアクセス時にクッキーおよび類似技術をどのように使用するかを説明します。' }] },
  { key: 'c02', title: '2. クッキーとは', blocks: [{ kind: 'p', text: 'クッキーは、ウェブサイト訪問時にユーザーのデバイスに保存される小さなテキストファイルです。' }, { kind: 'p', text: 'ウェブサイトの機能およびユーザー体験の向上に役立ちます。' }] },
  { key: 'c03', title: '3. 使用するクッキーの種類', blocks: [{ kind: 'p', text: '必須クッキー — プラットフォーム運営に必要（認証、セッション、セキュリティ）。' }, { kind: 'ul', items: ['認証クッキー', 'セッション管理', 'セキュリティ制御'] }, { kind: 'p', text: '分析クッキー — プラットフォーム利用状況の把握（ページ統計、パフォーマンス）。' }, { kind: 'ul', items: ['ページ利用統計', 'パフォーマンス監視'] }, { kind: 'p', text: '設定クッキー — 言語およびインターフェース設定などユーザー設定の記憶。' }, { kind: 'ul', items: ['言語設定', 'インターフェース構成'] }] },
  { key: 'c04', title: '4. クッキーの管理' },
  { key: 'c05', title: '5. 更新' },
  { key: 'c06', title: 'お問い合わせ' },
]

const jaSlaTitles = titleOnlyKeys([
  { key: 'sla01', title: '1. はじめに' },
  { key: 'sla02', title: '2. サービス範囲' },
  { key: 'sla03', title: '3. サービス可用性' },
  { key: 'sla04', title: '4. 定期メンテナンス' },
  { key: 'sla05', title: '5. インシデント管理' },
  { key: 'sla06', title: '6. サポートチャネル' },
  { key: 'sla07', title: '7. データバックアップおよび復旧' },
  { key: 'sla08', title: '8. セキュリティおよび監視' },
  { key: 'sla09', title: '9. サービスクレジット' },
  { key: 'sla10', title: '10. 顧客の責任' },
  { key: 'sla11', title: '11. SLA の変更' },
  { key: 'sla12', title: '12. 準拠法' },
  { key: 'sla13', title: 'お問い合わせ' },
])

const jaRaiTitles = titleOnlyKeys([
  { key: 'rai01', title: '1. はじめに' },
  { key: 'rai02', title: '2. {brand} プラットフォームにおける目的' },
  { key: 'rai03', title: '3. 人間による監督' },
  { key: 'rai04', title: '4. データ保護およびプライバシー' },
  { key: 'rai05', title: '5. 透明性' },
  { key: 'rai06', title: '6. 公平性および責任ある利用' },
  { key: 'rai07', title: '7. セキュリティ' },
  { key: 'rai08', title: '8. 継続的改善' },
  { key: 'rai09', title: '9. 制限事項' },
  { key: 'rai10', title: '10. 懸念事項の報告' },
  { key: 'rai11', title: '11. 本ポリシーの更新' },
  { key: 'rai12', title: 'お問い合わせ' },
])

const jaCompareFeat = {
  infra_users: 'ユーザー',
  infra_db_gb: 'DB（GB）',
  infra_file_gb: 'ファイル（GB）',
  infra_app_ram: 'アプリ RAM（論理）',
  infra_db_ram_share: 'DB RAM 共有',
  infra_redis_share: 'Redis 共有',
  infra_tier: 'インフラティア',
  acct_accounting: '会計',
  acct_bookkeeping: '簿記',
  acct_invoice: '請求書',
  acct_auto_image_scan: '自動画像スキャン（請求書、領収書）',
  hr_attendance_leave: '勤怠/休暇',
  hr_payroll: '給与',
  crm_sales_management: '営業管理',
  email_send_communicate: '送信およびコミュニケーション',
  support_technical: 'テクニカルサポート',
  support_i18n: '国際化',
  support_remove_branding: 'ブランディング削除',
  support_early_access: '新機能への早期アクセス',
  support_attack_protection: '攻撃防御',
  support_mfa: '多要素認証（MFA）',
}

const jaTermsKeys = {
  page_title: 'サービス利用規約',
  page_subtitle: '{brand} プラットフォーム サービス利用規約',
  meta_title: 'サービス利用規約',
  meta_description: 'サービス利用規約。',
  ...titleOnlyKeys(jaTermsSections.map(({ key, title }) => ({ key, title }))),
  ...flattenSectionsPartial(
    jaTermsSections.filter((s) => s.blocks),
    ['s01', 's02', 's03'],
  ),
}
const jaPrivacyKeys = {
  page_title: 'プライバシーポリシー',
  page_subtitle: 'PDPA 準拠プライバシーポリシー',
  meta_title: 'プライバシーポリシー',
  meta_description: 'プライバシーポリシーおよび PDPA コンプライアンス。',
  ...titleOnlyKeys(jaPrivacySections.map(({ key, title }) => ({ key, title }))),
  ...flattenSectionsPartial(
    jaPrivacySections.filter((s) => s.blocks),
    ['p01', 'p02', 'p03'],
  ),
}
const jaCookieKeys = {
  page_title: 'クッキーポリシー',
  meta_title: 'クッキーポリシー',
  meta_description: 'クッキーポリシー。',
  ...titleOnlyKeys(jaCookieSections.map(({ key, title }) => ({ key, title }))),
  ...flattenSectionsPartial(
    jaCookieSections.filter((s) => s.blocks),
    ['c01', 'c02', 'c03'],
  ),
}

removeKeysMatching('locales/ja/www/cookie-policy.page.json', /^c03_li\d+$/)
removeKeysMatching('locales/zh/www/cookie-policy.page.json', /^c03_li\d+$/)
removeKeysMatching('locales/ja/www/sla.page.json', /^sla\d+_li\d+$/)
removeKeysMatching('locales/zh/www/sla.page.json', /^sla\d+_li\d+$/)

patchJaLegal('www/terms.page.json', jaTermsKeys)
patchJaLegal('www/privacy.page.json', jaPrivacyKeys)
patchJaLegal('www/cookie-policy.page.json', jaCookieKeys)
patchJaLegal('www/sla.page.json', { page_title: 'サービスレベル契約（SLA）', meta_title: 'サービスレベル契約', meta_description: 'サービスレベル契約。', ...jaSlaTitles })
patchJaLegal('www/responsible-ai.page.json', { page_title: '責任ある利用ポリシー', meta_title: '責任ある利用ポリシー', meta_description: '責任ある AI 利用ポリシー。', ...jaRaiTitles })
patchJaLegal('www/pricing.page.json', compareFeatKeys(jaCompareFeat))

// ── Chinese Simplified (same scope as Japanese) ────────────────────────────

const zhTermsSections = [
  { key: 's01', title: '1. 引言', blocks: [{ kind: 'p', text: '本服务条款（「条款」）规范对新加坡法人 iPrego Pte. Ltd. 提供的 {brand} 平台及相关服务的访问与使用。' }, { kind: 'p', text: '访问或使用 {brand} 平台即表示您同意受本条款约束。' }, { kind: 'p', text: '若您不同意本条款，则不得使用本服务。' }] },
  { key: 's02', title: '2. 关于服务', blocks: [{ kind: 'p', text: '{brand} 是基于云的 SaaS 平台，提供包括以下在内的集成商业软件解决方案：' }, { kind: 'ul', items: ['企业资源规划（ERP）', '会计与财务自动化', '人力资源管理', '客户关系管理（CRM）', '商业分析与报告', '工作流自动化'] }, { kind: 'p', text: '服务通过 iPrego Pte. Ltd. 运营的 Web 应用程序提供。' }] },
  { key: 's03', title: '3. 使用资格', blocks: [{ kind: 'p', text: '使用 {brand} 平台须年满 18 周岁且具备订立有约束力协议的法律能力。' }, { kind: 'p', text: '若您代表组织使用服务，则确认您有权使该组织受本条款约束。' }] },
  { key: 's04', title: '4. 用户账户' },
  { key: 's05', title: '5. 可接受使用' },
  { key: 's06', title: '6. 客户数据' },
  { key: 's07', title: '7. 辅助与自动化功能' },
  { key: 's08', title: '8. 费用与订阅' },
  { key: 's09', title: '9. 服务可用性' },
  { key: 's10', title: '10. 知识产权' },
  { key: 's11', title: '11. 终止' },
  { key: 's12', title: '12. 责任限制' },
  { key: 's13', title: '13. 适用法律' },
  { key: 's14', title: '14. 更新' },
]

const zhPrivacySections = [
  { key: 'p01', title: '1. 引言', blocks: [{ kind: 'p', text: '本隐私政策说明 iPrego Pte. Ltd. 如何依据新加坡《个人数据保护法》（PDPA）收集、使用、披露和保护个人数据。' }, { kind: 'p', text: '使用 {brand} 平台即表示您同意本政策所述做法。' }] },
  { key: 'p02', title: '2. 我们收集的个人数据', blocks: [{ kind: 'p', text: '我们可能收集账户信息（姓名、电子邮件、公司、联系方式）、使用信息（登录记录、设备数据、活动日志）以及上传至平台的客户业务数据（员工记录、财务与运营数据）等个人数据。' }, { kind: 'p', text: '这些数据作为提供平台服务的一部分进行处理。' }] },
  { key: 'p03', title: '3. 数据收集目的', blocks: [{ kind: 'p', text: '个人数据可能用于以下目的：' }, { kind: 'ul', items: ['提供并运营 {brand} 平台', '验证用户身份', '提供客户支持', '改进服务性能', '维护平台安全', '遵守法律义务'] }] },
  { key: 'p04', title: '4. 同意' },
  { key: 'p05', title: '5. 个人数据披露' },
  { key: 'p06', title: '6. 数据保护措施' },
  { key: 'p07', title: '7. 数据保留' },
  { key: 'p08', title: '8. 访问与更正' },
  { key: 'p09', title: '9. 国际数据传输' },
  { key: 'p10', title: '10. 数据保护官' },
  { key: 'p11', title: '11. 政策更新' },
]

const zhCookieSections = [
  { key: 'c01', title: '1. 引言', blocks: [{ kind: 'p', text: '本 Cookie 政策说明 iPrego Pte. Ltd. 在用户访问 {brand} 网站或平台时如何使用 Cookie 及类似技术。' }] },
  { key: 'c02', title: '2. 什么是 Cookie', blocks: [{ kind: 'p', text: 'Cookie 是用户访问网站时存储在其设备上的小型文本文件。' }, { kind: 'p', text: '它们有助于改善网站功能与用户体验。' }] },
  { key: 'c03', title: '3. 我们使用的 Cookie 类型', blocks: [{ kind: 'p', text: '必要 Cookie — 平台运行所必需（认证、会话、安全）。' }, { kind: 'ul', items: ['认证 Cookie', '会话管理', '安全控制'] }, { kind: 'p', text: '分析 Cookie — 用于了解平台使用情况（页面统计、性能）。' }, { kind: 'ul', items: ['页面使用统计', '性能监控'] }, { kind: 'p', text: '偏好 Cookie — 记住语言与界面配置等用户设置。' }, { kind: 'ul', items: ['语言偏好', '界面配置'] }] },
  { key: 'c04', title: '4. 管理 Cookie' },
  { key: 'c05', title: '5. 更新' },
  { key: 'c06', title: '联系我们' },
]

const zhSlaTitles = titleOnlyKeys([
  { key: 'sla01', title: '1. 引言' },
  { key: 'sla02', title: '2. 服务范围' },
  { key: 'sla03', title: '3. 服务可用性' },
  { key: 'sla04', title: '4. 计划维护' },
  { key: 'sla05', title: '5. 事件管理' },
  { key: 'sla06', title: '6. 支持渠道' },
  { key: 'sla07', title: '7. 数据备份与恢复' },
  { key: 'sla08', title: '8. 安全与监控' },
  { key: 'sla09', title: '9. 服务积分' },
  { key: 'sla10', title: '10. 客户责任' },
  { key: 'sla11', title: '11. SLA 变更' },
  { key: 'sla12', title: '12. 适用法律' },
  { key: 'sla13', title: '联系我们' },
])

const zhRaiTitles = titleOnlyKeys([
  { key: 'rai01', title: '1. 引言' },
  { key: 'rai02', title: '2. {brand} 平台内的目的' },
  { key: 'rai03', title: '3. 人工监督' },
  { key: 'rai04', title: '4. 数据保护与隐私' },
  { key: 'rai05', title: '5. 透明度' },
  { key: 'rai06', title: '6. 公平与负责任使用' },
  { key: 'rai07', title: '7. 安全' },
  { key: 'rai08', title: '8. 持续改进' },
  { key: 'rai09', title: '9. 局限性' },
  { key: 'rai10', title: '10. 报告问题' },
  { key: 'rai11', title: '11. 政策更新' },
  { key: 'rai12', title: '联系我们' },
])

const zhCompareFeat = {
  infra_users: '用户',
  infra_db_gb: '数据库（GB）',
  infra_file_gb: '文件（GB）',
  infra_app_ram: '应用 RAM（逻辑）',
  infra_db_ram_share: '数据库 RAM 共享',
  infra_redis_share: 'Redis 共享',
  infra_tier: '基础设施层级',
  acct_accounting: '会计',
  acct_bookkeeping: '簿记',
  acct_invoice: '发票',
  acct_auto_image_scan: '自动图像扫描（发票、收据）',
  hr_attendance_leave: '考勤/请假',
  hr_payroll: '薪资',
  crm_sales_management: '销售管理',
  email_send_communicate: '发送与沟通',
  support_technical: '技术支持',
  support_i18n: '国际化',
  support_remove_branding: '移除品牌标识',
  support_early_access: '新功能抢先体验',
  support_attack_protection: '攻击防护',
  support_mfa: '多因素认证（MFA）',
}

const zhTermsKeys = {
  page_title: '服务条款',
  page_subtitle: '{brand} 平台服务条款',
  meta_title: '服务条款',
  meta_description: '服务条款。',
  ...titleOnlyKeys(zhTermsSections.map(({ key, title }) => ({ key, title }))),
  ...flattenSectionsPartial(
    zhTermsSections.filter((s) => s.blocks),
    ['s01', 's02', 's03'],
  ),
}
const zhPrivacyKeys = {
  page_title: '隐私政策',
  page_subtitle: '符合 PDPA 的隐私政策',
  meta_title: '隐私政策',
  meta_description: '隐私政策与 PDPA 合规。',
  ...titleOnlyKeys(zhPrivacySections.map(({ key, title }) => ({ key, title }))),
  ...flattenSectionsPartial(
    zhPrivacySections.filter((s) => s.blocks),
    ['p01', 'p02', 'p03'],
  ),
}
const zhCookieKeys = {
  page_title: 'Cookie 政策',
  meta_title: 'Cookie 政策',
  meta_description: 'Cookie 政策。',
  ...titleOnlyKeys(zhCookieSections.map(({ key, title }) => ({ key, title }))),
  ...flattenSectionsPartial(
    zhCookieSections.filter((s) => s.blocks),
    ['c01', 'c02', 'c03'],
  ),
}

for (const [pageRel, keys] of [
  ['www/terms.page.json', zhTermsKeys],
  ['www/privacy.page.json', zhPrivacyKeys],
  ['www/cookie-policy.page.json', zhCookieKeys],
  ['www/sla.page.json', { page_title: '服务级别协议（SLA）', meta_title: '服务级别协议', meta_description: '服务级别协议。', ...zhSlaTitles }],
  ['www/responsible-ai.page.json', { page_title: '负责任使用政策', meta_title: '负责任使用政策', meta_description: '负责任 AI 使用政策。', ...zhRaiTitles }],
  ['www/pricing.page.json', compareFeatKeys(zhCompareFeat)],
]) {
  const locRel = `locales/zh/${pageRel}`
  const status = decideJaZhStatus(`sources/en/${pageRel}`, locRel, keys)
  countMerge(locRel, keys, { translationStatus: status, method: 'patch-legal-full-body' })
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('patch-legal-full-body: key counts per page')
for (const [page, { new: newCount, updated, merged }] of Object.entries(stats)) {
  console.log(`  ${page}: +${newCount} new, ~${updated} updated (${merged} keys merged)`)
}
console.log('patch-legal-full-body: OK')
