#!/usr/bin/env node
/**
 * Apply ru/my www page translations from compact override maps.
 * Run: node scripts/apply-ru-my-www-translations.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const enDir = path.join(root, 'sources/en/www')

/** @type {Record<string, Record<string, Record<string, string>>>} */
const META_ONLY = {
  pricing: {
    ru: {
      meta_title: 'Цены | Vouus',
      meta_description:
        'Прозрачные тарифы для команд, масштабирующих HR и финансовые рабочие процессы. Сравните уровни Foundation и начните бесплатную пробную версию.',
    },
    my: {
      meta_title: 'စျေးနှုန်း | Vouus',
      meta_description:
        'HR နှင့် finance workflows ကို scale လုပ်နေသော အဖွဲ့များအတွက် transparent plans။ Foundation tiers နှိုင်းယှဉ်ပြီး အခမဲ့ trial စတင်ပါ။',
    },
  },
  product_accounting: {
    ru: {
      meta_title: 'Автоматизация финансов',
      meta_description: 'Автоматизация финансов и отчётность.',
    },
    my: {
      meta_title: 'Finance Automation',
      meta_description: 'Finance automation နှင့် reporting။',
    },
  },
  product_bi: {
    ru: { meta_title: 'Бизнес-аналитика', meta_description: 'Дашборды и операционные KPI.' },
    my: { meta_title: 'Business Intelligence', meta_description: 'Dashboards နှင့် operational KPIs။' },
  },
  product_crm: {
    ru: {
      meta_title: 'Продажи и CRM',
      meta_description: 'Воронка, записи клиентов и аналитика продаж.',
    },
    my: {
      meta_title: 'Sales & CRM',
      meta_description: 'Pipeline၊ customer records နှင့် sales insights။',
    },
  },
  product_erp: {
    ru: {
      meta_title: 'Единая ERP-платформа',
      meta_description: 'Единая ERP для HR, финансов и операций.',
    },
    my: {
      meta_title: 'Unified ERP Platform',
      meta_description: 'HR၊ finance နှင့် operations အတွက် unified ERP။',
    },
  },
  product_ocr: {
    ru: {
      meta_title: 'OCR / Сканирование чеков и счетов',
      meta_description: 'Мобильный захват и извлечение данных из чеков.',
    },
    my: {
      meta_title: 'OCR / Receipt & Invoice Scan',
      meta_description: 'Mobile capture နှင့် receipt extraction။',
    },
  },
  pricing_draft: {
    ru: { meta_title: 'Цены (черновик)', meta_description: 'Предпросмотр черновика цен.' },
    my: { meta_title: 'Pricing (draft)', meta_description: 'Draft pricing preview။' },
  },
  pricing_v1: {
    ru: { meta_title: 'Цены (предпросмотр)', meta_description: 'Внутренний предпросмотр цен.' },
    my: { meta_title: 'Pricing (preview)', meta_description: 'Internal pricing preview။' },
  },
  privacy: {
    ru: { meta_title: 'Политика конфиденциальности', meta_description: 'Политика конфиденциальности и соответствие PDPA.' },
    my: { meta_title: 'Privacy Policy', meta_description: 'Privacy policy နှင့် PDPA compliance။' },
  },
  cookie_policy: {
    ru: { meta_title: 'Политика cookie', meta_description: 'Политика использования cookie.' },
    my: { meta_title: 'Cookie Policy', meta_description: 'Cookie policy။' },
  },
  responsible_ai: {
    ru: { meta_title: 'Политика ответственного использования', meta_description: 'Политика ответственного использования AI.' },
    my: { meta_title: 'Responsible Use Policy', meta_description: 'Responsible AI use policy။' },
  },
  docs: {
    ru: { meta_title: 'Документация', meta_description: 'Документация продукта и ресурсы для разработчиков.' },
    my: { meta_title: 'Documentation', meta_description: 'Product documentation နှင့် developer resources။' },
  },
  sla: {
    ru: { meta_title: 'Соглашение об уровне обслуживания', meta_description: 'SLA и доступность сервиса.' },
    my: { meta_title: 'Service Level Agreement', meta_description: 'SLA နှင့် service availability။' },
  },
  terms: {
    ru: { meta_title: 'Условия обслуживания', meta_description: 'Условия использования платформы Vouus.' },
    my: { meta_title: 'Terms of Service', meta_description: 'Vouus platform terms of use။' },
  },
  solutions: {
    ru: {
      meta_title: 'Решения | Vouus',
      meta_description:
        'Решения по роли и размеру компании — одна основа рабочих процессов для людей, финансов и согласований.',
    },
    my: {
      meta_title: 'ဖြေရှင်းချက်များ | Vouus',
      meta_description:
        'Role နှင့် company size အလိုက် — လူများ၊ ငွေနှင့် approvals အတွက် workflow spine တစ်ခု။',
    },
  },
  solutions_finance: {
    ru: {
      meta_title: 'Решения для финансовых команд | Vouus',
      meta_description:
        'Расходы, eInvoice и закрытие как связанные рабочие процессы с видимыми согласованиями для аудиторов.',
    },
    my: {
      meta_title: 'Finance Teams | Vouus',
      meta_description: 'Expense၊ eInvoice နှင့် close workflows — auditors အတွက် visible approvals။',
    },
  },
  solutions_hr: {
    ru: {
      meta_title: 'Решения для HR-команд | Vouus',
      meta_description: 'Кадры, зарплата, посещаемость и отпуска на одном пути с автоматизацией.',
    },
    my: {
      meta_title: 'HR Teams | Vouus',
      meta_description: 'Records၊ payroll၊ attendance နှင့် leave — automation ဖြင့် တစ်လမ်းတည်း။',
    },
  },
  solutions_sales: {
    ru: {
      meta_title: 'Решения для отделов продаж | Vouus',
      meta_description: 'Воронка, предложения и заказы в рабочих процессах, синхронизированных с биллингом.',
    },
    my: {
      meta_title: 'Sales Teams | Vouus',
      meta_description: 'Pipeline၊ quotes နှင့် orders — billing နှင့် sync ဖြစ်သော workflows။',
    },
  },
  solutions_startups: {
    ru: {
      meta_title: 'Решения для стартапов | Vouus',
      meta_description: 'Базовый план с ERP, согласованиями и автоматизацией для основателей.',
    },
    my: {
      meta_title: 'Startups | Vouus',
      meta_description: 'Founders အတွက် core ERP၊ approvals နှင့် workflow automation။',
    },
  },
  solutions_enterprise_security: {
    ru: {
      meta_title: 'Безопасность | Vouus Enterprise',
      meta_description: 'Соответствие, практики безопасности и защита данных в {brand}.',
    },
    my: {
      meta_title: 'Security | Vouus Enterprise',
      meta_description: '{brand} တွင် compliance၊ security practices နှင့် data protection။',
    },
  },
  solutions_enterprise_system_status: {
    ru: {
      meta_title: 'Статус системы | Vouus',
      meta_description: 'Статус серверов и сервисов {brand} в реальном времени.',
    },
    my: {
      meta_title: 'System Status | Vouus',
      meta_description: '{brand} servers နှင့် services ၏ real-time status။',
    },
  },
  solutions_enterprise_case_studies: {
    ru: {
      meta_title: 'Кейсы | Vouus Enterprise',
      meta_description: 'Реальные шаблоны рабочих процессов команд, использующих {brand}.',
    },
    my: {
      meta_title: 'Case Studies | Vouus Enterprise',
      meta_description: '{brand} သုံးသော teams ၏ real workflow patterns။',
    },
  },
  solutions_enterprise_dpa: {
    ru: {
      meta_title: 'DPA | Vouus Enterprise',
      meta_description: 'DPA в соответствии с PDPA между iPrego Pte. Ltd. и клиентами {brand}.',
    },
    my: {
      meta_title: 'DPA | Vouus Enterprise',
      meta_description: 'iPrego Pte. Ltd. နှင့် {brand} customers အကြား PDPA-aligned DPA။',
    },
  },
  blog_how_to_choose_an_erp_for_smes: {
    ru: {
      meta_title: 'Как выбрать ERP для растущего МСБ',
      meta_description:
        'Большинство чек-листов ERP фокусируются на функциях. Главный вопрос — подходит ли система тому, как команда реально работает.',
    },
    my: {
      meta_title: 'Growing SME အတွက် ERP ဘယ်လိုရွေးမလဲ',
      meta_description:
        'ERP evaluation checklists များစွာက features ကို focus လုပ်သည်။ အဓိကမေးခွန်းက system က team ရဲ့ actual workflow နဲ့ match ဖြစ်မဖြစ်။',
    },
  },
  blog_vouus_vs_spreadsheets: {
    ru: {
      meta_title: 'ERP vs таблицы',
      meta_description: 'Признаки того, что таблицы тормозят вашу команду.',
    },
    my: {
      meta_title: 'ERP vs Spreadsheets',
      meta_description: 'Spreadsheets က team ကို hold back နေသည့် warning signs။',
    },
  },
  blog_workflow_automation_basics: {
    ru: {
      meta_title: 'Основы автоматизации рабочих процессов',
      meta_description: 'Триггеры, условия и действия для бизнес-процессов.',
    },
    my: {
      meta_title: 'Workflow Automation Basics',
      meta_description: 'Business workflows အတွက် triggers၊ conditions နှင့် actions။',
    },
  },
  trial_manual_approval_complete: {
    ru: { meta_title: 'Пробная версия — одобрено', meta_description: 'Ручное одобрение пробной версии завершено.' },
    my: { meta_title: 'Trial — Approved', meta_description: 'Manual trial approval complete။' },
  },
  trial_manual_approval_verify: {
    ru: { meta_title: 'Пробная версия — подтверждение', meta_description: 'Подтвердите рабочую почту для пробной версии.' },
    my: { meta_title: 'Trial — Verify', meta_description: 'Trial အတွက် work email verify လုပ်ပါ။' },
  },
}

// Map stem aliases (file names with hyphens)
const STEM_ALIASES = {
  cookie_policy: 'cookie-policy',
  responsible_ai: 'responsible-ai',
  blog_how_to_choose_an_erp_for_smes: 'blog_how-to-choose-an-erp-for-smes',
  blog_vouus_vs_spreadsheets: 'blog_vouus-vs-spreadsheets',
  blog_workflow_automation_basics: 'blog_workflow-automation-basics',
  trial_manual_approval_complete: 'trial_manual-approval_complete',
  trial_manual_approval_verify: 'trial_manual-approval_verify',
  solutions_enterprise_case_studies: 'solutions_enterprise_case-studies',
  solutions_enterprise_system_status: 'solutions_enterprise_system-status',
}

function stemToFile(stem) {
  return `${STEM_ALIASES[stem] ?? stem}.page.json`
}

function applyOverrides(stem, locale, keys) {
  const file = stemToFile(stem)
  const target = path.join(root, 'locales', locale, 'www', file)
  if (!fs.existsSync(target)) {
    console.warn(`skip missing ${target}`)
    return
  }
  const doc = JSON.parse(fs.readFileSync(target, 'utf8'))
  Object.assign(doc.keys, keys)
  fs.writeFileSync(target, `${JSON.stringify(doc, null, 2)}\n`)
  console.log(`meta ${locale}/www/${file} (+${Object.keys(keys).length} keys)`)
}

for (const [stem, localeMap] of Object.entries(META_ONLY)) {
  for (const [locale, keys] of Object.entries(localeMap)) {
    applyOverrides(stem, locale, keys)
  }
}

// Hero-only patches for pages with hero_description still EN
/** @type {Record<string, Record<string, { hero_description: string, hero_title?: string, meta_title?: string, meta_description?: string }>>} */
const HERO_PATCHES = {
  product_hr: {
    ru: {
      hero_description:
        'HR-операции на одной основе рабочих процессов — посещаемость, отпуска и зарплата с аудируемой историей в {brand}.',
      meta_title: 'HR | Vouus',
    },
    my: {
      hero_description:
        'HR ops က workflow spine တစ်ခုတည်းတွင် — attendance၊ leave နှင့် payroll သည် {brand} တွင် audit-ready history မျှဝေသည်။',
      meta_title: 'HR | Vouus',
    },
  },
}

for (const [stem, localeMap] of Object.entries(HERO_PATCHES)) {
  for (const [locale, keys] of Object.entries(localeMap)) {
    applyOverrides(stem, locale, keys)
  }
}

console.log('apply-ru-my-www-translations: done')
