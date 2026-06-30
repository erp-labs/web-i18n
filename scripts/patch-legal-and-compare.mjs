/**
 * Legal page section keys (cookie, sla, responsible-ai) + compare categories + expanded ko legal.
 * Run: node scripts/patch-legal-and-compare.mjs && npm run batch:seed-missing && npm run sync
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

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
  { key: 'c06', title: 'Contact', blocks: [{ kind: 'p', text: 'For legal or privacy matters:' }, { kind: 'p', text: 'Contact details are published in our Privacy Policy.' }] },
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

mergeKeys('sources/en/www/cookie-policy.page.json', { page_title: 'Cookie Policy', ...flattenSections(cookieSections) })
mergeKeys('sources/en/www/sla.page.json', { page_title: 'Service Level Agreement (SLA)', ...flattenSections(slaSections) })
mergeKeys('sources/en/www/responsible-ai.page.json', { page_title: 'Responsible use policy', ...flattenSections(raiSections) })

const compareCats = {
  compare_cat_Infra: 'Infra',
  compare_cat_Accounting: 'Accounting',
  compare_cat_HR: 'HR',
  compare_cat_CRM: 'CRM',
  compare_cat_Email: 'Email',
  compare_cat_Support: 'Support',
}
mergeKeys('sources/en/www/pricing.page.json', compareCats)

const koCookie = {
  page_title: '쿠키 정책',
  c01_title: '1. 소개',
  c01_p0: '본 쿠키 정책은 iPrego Pte. Ltd.가 {brand} 웹사이트 및 플랫폼에서 쿠키와 유사 기술을 어떻게 사용하는지 설명합니다.',
  c02_title: '2. 쿠키란',
  c02_p0: '쿠키는 웹사이트 방문 시 사용자 기기에 저장되는 작은 텍스트 파일입니다.',
  c03_title: '3. 사용하는 쿠키 유형',
  c04_title: '4. 쿠키 관리',
  c04_p0: '브라우저 설정으로 쿠키를 제어할 수 있습니다.',
  c05_title: '5. 업데이트',
}
mergeKeys('locales/ko/www/cookie-policy.page.json', koCookie, { translationStatus: 'reviewed' })

const koSla = {
  page_title: '서비스 수준 협약(SLA)',
  sla01_title: '1. 소개',
  sla01_p0: '본 SLA는 싱가포르 iPrego Pte. Ltd.가 제공하는 {brand} 플랫폼의 가용성 및 지원 정책을 설명합니다.',
  sla03_title: '3. 서비스 가용성',
  sla03_p0: '목표 가용성: 월 99.9% 업타임.',
}
mergeKeys('locales/ko/www/sla.page.json', koSla, { translationStatus: 'reviewed' })

const koRai = {
  page_title: '책임 있는 이용 정책',
  rai01_title: '1. 소개',
  rai01_p0: '본 정책은 iPrego Pte. Ltd.가 {brand} 플랫폼의 보조·자동화 기능을 투명성과 책임감 있게 운영하는 원칙을 설명합니다.',
  rai04_title: '4. 데이터 보호 및 개인정보',
}
mergeKeys('locales/ko/www/responsible-ai.page.json', koRai, { translationStatus: 'reviewed' })

const enTermsTitles = {
  s02_title: '2. About the Service',
  s03_title: '3. Eligibility',
  s04_title: '4. User Accounts',
  s05_title: '5. Acceptable Use',
  s06_title: '6. Customer Data',
  s07_title: '7. Assisted and automated features',
  s08_title: '8. Fees and Subscription',
  s09_title: '9. Service Availability',
  s10_title: '10. Intellectual Property',
  s11_title: '11. Termination',
  s12_title: '12. Limitation of Liability',
  s13_title: '13. Governing Law',
  s14_title: '14. Updates',
}
mergeKeys('sources/en/www/terms.page.json', enTermsTitles)

const enPrivacyTitles = {
  p02_title: '2. Personal Data We Collect',
  p03_title: '3. Purpose of Data Collection',
  p04_title: '4. Consent',
  p05_title: '5. Disclosure of Personal Data',
  p06_title: '6. Data Protection Measures',
  p07_title: '7. Data Retention',
  p08_title: '8. Access and Correction',
  p09_title: '9. International Data Transfers',
  p10_title: '10. Data Protection Officer',
  p11_title: '11. Updates to this Policy',
}
mergeKeys('sources/en/www/privacy.page.json', enPrivacyTitles)

const koTermsTitles = {
  s02_title: '2. 서비스 소개',
  s03_title: '3. 이용 자격',
  s04_title: '4. 사용자 계정',
  s05_title: '5. 허용 가능한 이용',
  s06_title: '6. 고객 데이터',
  s07_title: '7. 보조 및 자동화 기능',
  s08_title: '8. 요금 및 구독',
  s09_title: '9. 서비스 가용성',
  s10_title: '10. 지적 재산권',
  s11_title: '11. 해지',
  s12_title: '12. 책임의 한계',
  s13_title: '13. 준거법',
  s14_title: '14. 업데이트',
}
mergeKeys('locales/ko/www/terms.page.json', koTermsTitles)

const koPrivacyTitles = {
  p02_title: '2. 수집하는 개인정보',
  p03_title: '3. 수집 목적',
  p04_title: '4. 동의',
  p05_title: '5. 개인정보 제공',
  p06_title: '6. 데이터 보호 조치',
  p07_title: '7. 데이터 보존',
  p08_title: '8. 열람 및 정정',
  p09_title: '9. 국외 이전',
  p10_title: '10. 개인정보 보호 책임자',
  p11_title: '11. 방침 업데이트',
}
mergeKeys('locales/ko/www/privacy.page.json', koPrivacyTitles)

mergeKeys('locales/ko/www/pricing.page.json', {
  compare_cat_Infra: '인프라',
  compare_cat_Accounting: '회계',
  compare_cat_HR: 'HR',
  compare_cat_CRM: 'CRM',
  compare_cat_Email: '이메일',
  compare_cat_Support: '지원',
})

console.log('patch-legal-and-compare: OK')
