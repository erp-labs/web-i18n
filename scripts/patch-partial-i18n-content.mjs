/**
 * Adds pricing body keys, legal section keys (terms/privacy/dpa), and P0 ko overlays.
 * Run: node scripts/patch-partial-i18n-content.mjs && npm run sync
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
  doc.meta = { ...doc.meta, ...metaPatch }
  writeJson(pagePath, doc)
}

const pricingKeys = {
  hero_title: 'Simple pricing.',
  hero_description: 'Transparent plans for teams scaling HR and finance workflows.',
  plans_heading: 'Choose your plan',
  plans_subheading: 'Start with the essentials. Add capacity and automation as you grow.',
  trial_link_text: 'Start a free trial',
  trial_link_suffix: '— verify your work email, then continue to onboarding.',
  billing_monthly: 'Monthly',
  billing_yearly: 'Yearly',
  billing_save_badge: 'Save 10%',
  contact_us_label: 'Contact Us',
  billed_annually_label: 'billed annually',
  save_prefix: '— save',
  percent_off_label: '(10% off)',
  module_accounting: 'Accounting',
  module_hrms: 'HRMS',
  module_crm: 'CRM',
  plan_basic_name: 'Basic',
  plan_basic_tagline: 'Clean books from day one.',
  plan_basic_max_users: 'Max. 5 Users',
  plan_basic_core_value: 'Structured operational data',
  plan_basic_support: 'Email Support',
  plan_basic_cta: 'Select Basic',
  plan_professional_name: 'Pro',
  plan_professional_tagline: 'Payroll and approvals at scale.',
  plan_professional_badge: 'Recommended',
  plan_professional_max_users: 'Max. 20 Users',
  plan_professional_core_value: 'Payroll & team scaling',
  plan_professional_support: 'Chat Support',
  plan_professional_cta: 'Select Pro',
  plan_biz_name: 'Business',
  plan_biz_tagline: 'For mid-size teams that need analytics and dedicated capacity.',
  plan_biz_max_users: 'Max. 50 Users',
  plan_biz_core_value: 'Enterprise Analytics',
  plan_biz_support: 'Phone/Dedicated Supporter',
  plan_biz_cta: 'Select Business',
  plan_enterprise_name: 'Enterprise',
  plan_enterprise_tagline: 'Dedicated infrastructure and custom SLA.',
  plan_enterprise_max_users: 'Unlimited Users',
  plan_enterprise_core_value: 'Isolated environments',
  plan_enterprise_support: 'Dedicated Success Manager',
  plan_enterprise_cta: 'Talk to sales',
  compare_heading: 'Compare plans and features',
  compare_subtitle_1: 'All plans include core ERP modules with workflow automation.',
  compare_subtitle_2: "See what's included in each plan. Click plan names to toggle.",
  compare_feature_column: 'Feature',
  compare_download_label: 'Download selected packages',
  faq_heading: 'FAQ',
  faq_0_q: 'What is included in the platform subscription?',
  faq_0_a:
    'The subscription covers infrastructure, data compliance, and your core ERP modules. Higher tiers add capacity, dedicated resources, and richer support options.',
  faq_1_q: 'How should we scale as our business grows?',
  faq_1_a:
    'You can move to a higher tier to add users, capacity, and support levels. We will help you right-size the plan as your usage and teams grow.',
  faq_2_q: 'Are there user or system limits?',
  faq_2_a:
    'Each package has a user limit, but system usage (compute/storage) is scalable, and we offer pay-as-you-go options to support growth.',
  faq_3_q: 'Can we start small and expand later?',
  faq_3_a: 'Yes. Many teams begin with a smaller tier and move up as they onboard more users and workflows.',
  faq_4_q: 'Who is the Enterprise plan best suited for?',
  faq_4_a:
    'It is designed for large organizations requiring dedicated instances, on-premise deployment, or those with strict security mandates that require isolated environments.',
  faq_5_q: 'What payment methods do you accept?',
  faq_5_a:
    'We accept major credit cards, bank transfer, and invoice billing for annual plans. Contact us for enterprise payment options.',
  faq_6_q: 'Can we switch plans mid-cycle?',
  faq_6_a:
    'Yes. Upgrades take effect immediately; downgrades apply at the next billing period. Prorated credits may apply.',
  faq_7_q: 'Is there a free trial?',
  faq_7_a: 'Yes — start a 14-day Pro trial with your work email, then continue to onboarding.',
  faq_8_q: 'What happens if we exceed our user limit?',
  faq_8_a:
    'You can upgrade to a higher tier or add users via pay-as-you-go options. We will notify you before any overage charges apply.',
  faq_9_q: 'Do you offer annual discounts?',
  faq_9_a: 'Yes. Annual billing includes a 10% discount compared to monthly billing.',
}

mergeKeys('sources/en/www/pricing.page.json', pricingKeys)

const koPricing = {
  ...pricingKeys,
  meta_title: '요금 | Vouus',
  meta_description: 'HR·재무 워크플로를 확장하는 팀을 위한 투명한 요금제.',
  hero_title: '간단한 요금제.',
  hero_description: 'HR·재무 워크플로를 확장하는 팀을 위한 투명한 요금.',
  plans_heading: '플랜 선택',
  plans_subheading: '필수 기능부터 시작하고, 성장에 맞춰 용량과 자동화를 추가하세요.',
  trial_link_text: '무료 체험 시작',
  trial_link_suffix: '— 업무 이메일을 인증한 뒤 온보딩을 계속하세요.',
  billing_monthly: '월간',
  billing_yearly: '연간',
  billing_save_badge: '10% 할인',
  contact_us_label: '문의하기',
  compare_heading: '플랜 및 기능 비교',
  compare_subtitle_2: '각 플랜에 포함된 항목을 확인하세요. 플랜 이름을 클릭해 토글할 수 있습니다.',
  compare_feature_column: '기능',
  faq_heading: '자주 묻는 질문',
  plan_basic_name: 'Basic',
  plan_basic_tagline: '첫날부터 깔끔한 장부.',
  plan_professional_name: 'Pro',
  plan_professional_tagline: '규모 있는 급여와 승인.',
  plan_professional_badge: '추천',
  plan_enterprise_cta: '영업팀 문의',
  faq_0_q: '플랫폼 구독에 무엇이 포함되나요?',
  faq_0_a: '구독에는 인프라, 데이터 규정 준수, 핵심 ERP 모듈이 포함됩니다.',
  faq_7_q: '무료 체험이 있나요?',
  faq_7_a: '14일 Pro 체험을 제공합니다. 업무 이메일로 가입하고 온보딩을 완료하면 바로 사용할 수 있습니다.',
}

mergeKeys('locales/ko/www/pricing.page.json', koPricing, {
  translationStatus: 'reviewed',
  method: 'human-review-partial',
})

mergeKeys('sources/en/www/terms.page.json', {
  page_title: 'Terms of Service',
  page_subtitle: '{brand} Platform Terms of Service',
  s01_title: '1. Introduction',
  s01_p0:
    'These Terms of Service ("Terms") govern the access to and use of the {brand} platform and related services provided by iPrego Pte. Ltd., a company incorporated in Singapore.',
  s01_p1: 'By accessing or using the {brand} platform, you agree to be bound by these Terms.',
  s01_p2: 'If you do not agree with these Terms, you must not use the service.',
})

mergeKeys('sources/en/www/privacy.page.json', {
  page_title: 'Privacy Policy',
  page_subtitle: 'PDPA-Compliant Privacy Policy',
  p01_title: '1. Introduction',
  p01_p0:
    'This Privacy Policy explains how iPrego Pte. Ltd. collects, uses, discloses, and protects personal data in accordance with the Singapore Personal Data Protection Act (PDPA).',
  p01_p1: 'By using the {brand} platform, you consent to the practices described in this policy.',
})

mergeKeys('locales/ko/www/terms.page.json', {
  page_title: '서비스 이용약관',
  page_subtitle: '{brand} 플랫폼 서비스 이용약관',
  s01_title: '1. 소개',
  s01_p0:
    '본 서비스 이용약관("약관")은 싱가포르 법인 iPrego Pte. Ltd.가 제공하는 {brand} 플랫폼 및 관련 서비스의 접근 및 이용을 규정합니다.',
  s01_p1: '{brand} 플랫폼에 접근하거나 이용하면 본 약관에 동의하는 것으로 간주됩니다.',
  s01_p2: '본 약관에 동의하지 않으면 서비스를 이용할 수 없습니다.',
}, { translationStatus: 'reviewed', method: 'human-review-partial' })

mergeKeys('locales/ko/www/privacy.page.json', {
  page_title: '개인정보 처리방침',
  page_subtitle: 'PDPA 준수 개인정보 처리방침',
  p01_title: '1. 소개',
  p01_p0:
    '본 개인정보 처리방침은 iPrego Pte. Ltd.가 싱가포르 개인정보보호법(PDPA)에 따라 개인정보를 수집·이용·공개·보호하는 방법을 설명합니다.',
  p01_p1: '{brand} 플랫폼을 이용하면 본 방침에 설명된 관행에 동의하는 것으로 간주됩니다.',
}, { translationStatus: 'reviewed', method: 'human-review-partial' })

mergeKeys('locales/ko/www/contact.page.json', {
  hero_title: '문의하기',
  hero_subtitle: '플랫폼을 검토 중이든, 시작할 준비가 되었든, 기존 계정에 도움이 필요하든—영업일 기준 1일 이내에 답변드립니다.',
  channels_0_title: '영업',
  channels_0_description: '요금, 마이그레이션 지원 또는 맞춤 Enterprise 플랜을 논의하세요.',
  channels_0_cta: '데모 예약',
  channels_1_title: '일반 문의',
  channels_1_description: '플랫폼, 결제 또는 파트너십에 대한 질문은 이메일로 문의하세요.',
  channels_1_cta: '이메일 보내기',
  faq_0_q: '답변은 얼마나 빨리 받을 수 있나요?',
  faq_0_a: '영업 문의는 보통 영업일 기준 1일 이내에 답변합니다.',
}, { translationStatus: 'reviewed', method: 'human-review-partial' })

const koOverview = readJson('locales/ko/www/product_overview.page.json')
Object.assign(koOverview.keys, {
  hero_title: '업무 흐름을 위한 하나의 OS',
  hero_description: '사람·자금·업무를 설계하고 자동화하세요.',
  features_0_title: '연결된 HR',
  features_0_description: '근태와 휴가가 동일한 승인 경로에서 연결됩니다.',
  features_1_title: '재무 기반',
  features_1_description: '경비, eInvoice, 전기가 하나의 추적 경로로.',
  sections_0_headline: '분리된 도구',
  sections_0_body: '사일로가 모든 핸드오프를 지연시킵니다.',
  sections_1_headline: '하나의 워크플로 spine',
  sections_1_body: 'Vouus는 트리거·업무·승인을 하나의 기록에 매핑합니다.',
})
koOverview.meta = { ...koOverview.meta, translationStatus: 'reviewed', method: 'human-review-partial' }
writeJson('locales/ko/www/product_overview.page.json', koOverview)

console.log('patch-partial-i18n-content: OK')
