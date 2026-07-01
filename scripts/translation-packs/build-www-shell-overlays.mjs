#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(DIR, '../..')

const enShell = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources/en/www/shell.page.json'), 'utf8')).keys
delete enShell.path

const MEGA3_ASK = {
  mega_3_label: 'Why Vouus',
  mega_3_section_0_title: 'Architecture & Design',
  mega_3_section_0_item_0_label: 'System Architecture',
  mega_3_section_0_item_0_description: 'How Vouus connects your business',
  mega_3_section_0_item_1_label: 'Easy UI',
  mega_3_section_0_item_1_description: 'Task-based screens for everyday work',
  mega_3_section_0_item_2_label: 'Thin and Fast',
  mega_3_section_0_item_2_description: 'Edge-first, optimized for global teams',
  mega_3_section_0_item_3_label: 'Connectors',
  mega_3_section_0_item_3_description: 'Plug-and-play connector ecosystem',
  mega_3_section_0_item_4_label: 'Secure and Fast',
  mega_3_section_0_item_4_description: 'Deployment options and security model',
  mega_3_section_1_title: 'Business Value',
  mega_3_section_1_item_0_label: 'Market Position',
  mega_3_section_1_item_0_description: 'Where Vouus sits in the market',
  mega_3_section_1_item_1_label: 'Compare',
  mega_3_section_1_item_1_description: 'Vouus vs ERP, accounting, and SaaS tools',
  mega_3_section_1_item_2_label: 'Compliance Hub',
  mega_3_section_1_item_2_description: 'Government rules into workflows',
  mega_3_section_1_item_3_label: 'AI Agent Manager',
  mega_3_section_1_item_3_description: 'Manage AI agents like team members',
  mega_3_section_1_item_4_label: 'Globalization',
  mega_3_section_1_item_4_description: 'Multi-language, multi-country operations',
  mega_3_cta: 'Start free trial',
  mega_3_cta_secondary: 'Compare plans',
  ask_sales_label: 'Ask Sales',
  ask_sales_popup_title: 'Need a hand?',
  ask_sales_search_placeholder: 'Search docs',
  ask_sales_search_aria: 'Search documentation',
  ask_sales_help_0_label: 'Browse the docs',
  ask_sales_help_1_label: 'View our learning guides',
  ask_sales_help_2_label: 'Request a feature',
  ask_sales_help_3_label: "See what's new",
  ask_sales_help_4_label: 'Read our blog',
  ask_sales_help_5_label: 'System status',
  ask_sales_communities_label: 'Join our communities',
  ask_sales_chat_cta: 'Chat with an advisor',
}

const ALL_EN_KEYS = { ...enShell, ...MEGA3_ASK }
const EXPECTED = Object.keys(ALL_EN_KEYS).length

const partial = JSON.parse(fs.readFileSync(path.join(DIR, '_www-shell-locale-data.json'), 'utf8'))
const remaining = JSON.parse(fs.readFileSync(path.join(DIR, '_www-shell-locale-data-remaining.json'), 'utf8'))

const koShell = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales/ko/www/shell.page.json'), 'utf8')).keys
delete koShell.path

const koMegaAsk = {
  mega_3_label: 'Vouus를 선택하는 이유',
  mega_3_section_0_title: '아키텍처 및 설계',
  mega_3_section_0_item_0_label: '시스템 아키텍처',
  mega_3_section_0_item_0_description: 'Vouus가 비즈니스를 연결하는 방식',
  mega_3_section_0_item_1_label: '쉬운 UI',
  mega_3_section_0_item_1_description: '일상 업무를 위한 태스크 기반 화면',
  mega_3_section_0_item_2_label: '가볍고 빠름',
  mega_3_section_0_item_2_description: '엣지 우선, 글로벌 팀에 최적화',
  mega_3_section_0_item_3_label: '커넥터',
  mega_3_section_0_item_3_description: '플러그 앤 플레이 커넥터 생태계',
  mega_3_section_0_item_4_label: '안전하고 빠름',
  mega_3_section_0_item_4_description: '배포 옵션 및 보안 모델',
  mega_3_section_1_title: '비즈니스 가치',
  mega_3_section_1_item_0_label: '시장 포지션',
  mega_3_section_1_item_0_description: 'Vouus의 시장에서의 위치',
  mega_3_section_1_item_1_label: '비교',
  mega_3_section_1_item_1_description: 'Vouus vs ERP, 회계 및 SaaS 도구',
  mega_3_section_1_item_2_label: 'Compliance Hub',
  mega_3_section_1_item_2_description: '정부 규정을 워크플로우로',
  mega_3_section_1_item_3_label: 'AI Agent Manager',
  mega_3_section_1_item_3_description: '팀원처럼 AI 에이전트 관리',
  mega_3_section_1_item_4_label: '글로벌화',
  mega_3_section_1_item_4_description: '다국어, 다국가 운영',
  mega_3_cta: '무료 체험 시작',
  mega_3_cta_secondary: '요금제 비교',
  ask_sales_label: '영업 문의',
  ask_sales_popup_title: '도움이 필요하신가요?',
  ask_sales_search_placeholder: '문서 검색',
  ask_sales_search_aria: '문서 검색',
  ask_sales_help_0_label: '문서 둘러보기',
  ask_sales_help_1_label: '학습 가이드 보기',
  ask_sales_help_2_label: '기능 요청',
  ask_sales_help_3_label: '새 소식 보기',
  ask_sales_help_4_label: '블로그 읽기',
  ask_sales_help_5_label: '시스템 상태',
  ask_sales_communities_label: '커뮤니티 참여',
  ask_sales_chat_cta: '상담사와 채팅',
  hero_cta_primary: '무료 체험 시작',
  hero_cta_secondary: '15분 데모 보기',
}

const packs = { ko: { ...koShell, ...koMegaAsk }, ...partial, ...remaining }
const locales = ['ko', 'ja', 'zh', 'ar', 'vi', 'th', 'id', 'ms', 'si', 'ur', 'hi', 'ru', 'my']

const shellOut = {}
const heroOut = {}

for (const locale of locales) {
  const pack = packs[locale]
  if (!pack) throw new Error(`Missing locale: ${locale}`)
  const shell = {}
  for (const key of Object.keys(ALL_EN_KEYS)) {
    if (!(key in pack)) throw new Error(`${locale} missing ${key}`)
    shell[key] = pack[key]
  }
  if (Object.keys(shell).length !== EXPECTED) {
    throw new Error(`${locale} count ${Object.keys(shell).length} != ${EXPECTED}`)
  }
  shellOut[locale] = shell
  heroOut[locale] = {
    hero_cta_primary: pack.hero_cta_primary,
    hero_cta_secondary: pack.hero_cta_secondary,
  }
}

fs.writeFileSync(path.join(DIR, 'www-shell-overlays.json'), `${JSON.stringify(shellOut, null, 2)}\n`)
fs.writeFileSync(path.join(DIR, 'www-home-hero-cta.json'), `${JSON.stringify(heroOut, null, 2)}\n`)

console.log(`Expected shell keys per locale: ${EXPECTED}`)
for (const locale of locales) {
  console.log(`${locale}: shell=${Object.keys(shellOut[locale]).length}, hero=${Object.keys(heroOut[locale]).length}`)
}
