#!/usr/bin/env node
/** Human-reviewed P0 hero translations for www product/solutions pages. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '..', 'locales')

const PAGES = {
  'www/product_hr.page.json': {
    ko: {
      hero_title: '실제 승인과 연결된 HR',
      hero_description:
        '근태, 휴가, 급여가 하나의 워크플로우 축에서 감사 가능한 기록을 공유합니다—{brand}에서.',
    },
    ja: {
      hero_title: '実際の承認と連動するHR',
      hero_description:
        '勤怠・休暇・給与が一つのワークフロー基盤で監査可能な履歴を共有—{brand}で。',
    },
    zh: {
      hero_title: '与真实审批联动的 HR',
      hero_description: '考勤、请假与薪资在同一工作流主轴上共享可审计记录——在 {brand}。',
    },
  },
  'www/product_ocr.page.json': {
    ko: {
      hero_title: '영수증 캡처. 장부 자동 반영.',
      hero_description: '촬영·추출·승인—OCR이 종이를 경비 워크플로우 데이터로 바꿉니다.',
    },
    ja: {
      hero_title: '領収書を撮影。帳簿を更新。',
      hero_description: '撮影・抽出・承認—OCRが紙を経費ワークフローのデータに変換します。',
    },
    zh: {
      hero_title: '收据一拍，账本即更',
      hero_description: '拍照、提取、审批—OCR 将纸质凭证变为费用工作流数据。',
    },
  },
  'www/product_erp.page.json': {
    ko: {
      hero_title: '업무 흐름을 위한 하나의 시스템',
      hero_description:
        '{brand}는 분리된 도구를 하나의 워크플로우 우선 플랫폼으로 통합—소규모로 시작해 엔터프라이즈까지 확장.',
    },
    ja: {
      hero_title: '業務の流れのための一つのシステム',
      hero_description:
        '{brand}はバラバラなツールをワークフロー優先の一つのプラットフォームに—小さく始めてエンタープライズまで。',
    },
    zh: {
      hero_title: '一套系统驱动业务流转',
      hero_description: '{brand} 将分散工具整合为工作流优先平台—从小规模起步，扩展至企业级。',
    },
  },
  'www/solutions.page.json': {
    ko: {
      hero_title: '팀이 일하는 방식에 맞게',
      hero_description: '역할과 회사 규모별 맞춤—사람, 자금, 승인을 위한 하나의 워크플로우 축.',
    },
    ja: {
      hero_title: 'チームの働き方に合わせて',
      hero_description: '役割と会社規模に合わせて—人・お金・承認のための一つのワークフロー基盤。',
    },
    zh: {
      hero_title: '贴合团队的工作方式',
      hero_description: '按角色与公司规模定制—人、资金与审批共享一条工作流主轴。',
    },
  },
  'www/solutions_sales.page.json': {
    ko: {
      hero_title: '재무가 볼 수 있는 매출 흐름',
      hero_description:
        '파이프라인·견적·주문을 청구·인식과 동기화하는 워크플로우에서 운영—리스크는 분석이, 후속은 Automation이.',
    },
    ja: {
      hero_title: '財務が見える売上の流れ',
      hero_description:
        'パイプライン・見積・受注を請求・認識と同期するワークフロー—リスクは分析、フォローはAutomation。',
    },
    zh: {
      hero_title: '财务可见的收入动线',
      hero_description: '在同步账单与确认的工作流中运行管线、报价与订单—分析标风险，Automation 跟进度。',
    },
  },
  'www/solutions_hr.page.json': {
    ko: {
      hero_title: '실제 워크플로우와 연결된 HR 운영',
      hero_description:
        '인사·급여·근태·휴가·채용을 한 경로에서—Automation이 반복 업무를, 승인과 Scheduler가 마감을 지킵니다.',
    },
    ja: {
      hero_title: '実ワークフローと連動するHR運用',
      hero_description:
        '人事・給与・勤怠・休暇・採用を一つの経路で—Automationがルーティン、承認とSchedulerが締切を。',
    },
    zh: {
      hero_title: '与真实工作流联动的 HR 运营',
      hero_description: '人事、薪资、考勤、请假与招聘同一路径—Automation 处理例行，审批与 Scheduler 守截止。',
    },
  },
  'www/solutions_finance.page.json': {
    ko: {
      hero_title: '송장에서 원장까지 이어지는 재무',
      hero_description:
        '경비·전자세금계산서·마감을 연결된 워크플로우로—기계적 단계는 Scheduler·Automation, 승인은 감사인에게 투명.',
    },
    ja: {
      hero_title: '請求書から元帳までつながる財務',
      hero_description:
        '経費・eInvoice・締めを連結ワークフローで—機械的ステップはScheduler・Automation、承認は監査向けに可視。',
    },
    zh: {
      hero_title: '从发票到总账的财务主线',
      hero_description: '费用、eInvoice 与关账作为连通工作流—Scheduler 与 Automation 处理机械步骤，审批对审计可见。',
    },
  },
  'www/solutions_startups.page.json': {
    ko: {
      hero_title: '5명. 하나의 시스템. 첫날부터.',
      hero_description:
        '핵심 ERP·승인·워크플로우 자동화가 포함된 Basic 플랜—깔끔한 장부가 필요한 창업자를 위해.',
    },
    ja: {
      hero_title: '5人。一つのシステム。初日から。',
      hero_description:
        'コアERP・承認・ワークフロー自動化のBasicプラン—きれいな帳簿が必要な創業者向け。',
    },
    zh: {
      hero_title: '5 人。一套系统。首日可用。',
      hero_description: '含核心 ERP、审批与工作流自动化的 Basic 方案—为需要清晰账目的创始人而设。',
    },
  },
}

for (const [rel, byLocale] of Object.entries(PAGES)) {
  for (const [locale, keys] of Object.entries(byLocale)) {
    const file = path.join(localesDir, locale, rel)
    if (!fs.existsSync(file)) {
      console.warn(`skip missing ${file}`)
      continue
    }
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'))
    doc.keys = { ...doc.keys, ...keys, translationStatus: 'reviewed' }
    fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`)
    console.log(`patched ${locale}/${rel}`)
  }
}
