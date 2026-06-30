#!/usr/bin/env node
/**
 * Extract English canonical copy from product repos into sources/en/.
 * Updates manifest/pages.json and versions/{pageId}.json on EN hash change.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { basename, join } from 'node:path'
import {
  APP_ROUTE_BY_NAMESPACE,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_SOURCE_FILE,
  ERP_LABS_ROOT,
  PATHS,
  REPO_ROOT,
} from './lib/constants.mjs'
import { flattenKeys } from './lib/flatten-keys.mjs'
import { hashJson } from './lib/hash.mjs'
import { SHELL_BACKUP_KEYS, XERO_MIGRATION_KEYS, SHELL_COMMON_KEYS, SHELL_USERS_KEYS, SHELL_INTEGRATIONS_KEYS, ONBOARDING_COMPANY_KEYS, ONBOARDING_PLATFORM_KEYS, ONBOARDING_REVIEW_KEYS, ONBOARDING_LAUNCH_KEYS, ONBOARDING_DASHBOARD_KEYS, ONBOARDING_PROVISION_EMAIL_KEYS, ONBOARDING_PAYMENT_SUCCESS_KEYS } from './lib/admin-page-keys.mjs'

/** @typedef {{ pageId: string, surface: string, route: string | null, version: number, sourceHash: string, reviewRequired?: boolean, keys: Record<string, unknown>, meta: Record<string, string> }} PageDoc */

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function writeJson(path, data) {
  ensureDir(join(path, '..'))
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function loadPagesManifest() {
  return JSON.parse(readFileSync(PATHS.manifestPages, 'utf8'))
}

function savePagesManifest(manifest) {
  writeJson(PATHS.manifestPages, manifest)
}

function bumpVersion(pageId, enHash, prevVersion = 0) {
  const versionPath = join(PATHS.versions, `${pageId.replace(/\./g, '_')}.json`)
  /** @type {Array<{ version: number, enHash: string, locale: string, method: string, at: string }>} */
  let history = []
  if (existsSync(versionPath)) {
    history = JSON.parse(readFileSync(versionPath, 'utf8'))
  }
  const nextVersion = prevVersion + 1
  history.push({
    version: nextVersion,
    enHash,
    locale: 'en',
    method: 'extract',
    at: new Date().toISOString(),
  })
  ensureDir(PATHS.versions)
  writeJson(versionPath, history)
  return nextVersion
}

/** @type {PageDoc[]} */
const extractedPages = []

function registerPage(doc) {
  extractedPages.push(doc)
  const relPath = `sources/en/${doc.surface}/${basename(doc.meta.githubPath || '')}`
  const outPath = join(REPO_ROOT, relPath)
  writeJson(outPath, doc)
}

function extractEmployeeWeb() {
  const enPath = join(PATHS.employeeWebDict, 'en.json')
  if (!existsSync(enPath)) {
    console.warn('skip app: employee-web dictionaries/en.json not found')
    return
  }
  const en = JSON.parse(readFileSync(enPath, 'utf8'))
  for (const [namespace, keys] of Object.entries(en)) {
    const pageId = `app.${namespace}`
    const route = APP_ROUTE_BY_NAMESPACE[namespace] ?? `/{companyId}/{locale}/${namespace}`
    const sourceHash = hashJson(keys)
    const fileName = `${namespace}.page.json`
    const doc = {
      pageId,
      surface: 'app',
      route,
      version: 1,
      sourceHash,
      keys,
      meta: {
        productRepo: 'core-platform',
        sourcePath: `apps/employee-web/dictionaries/en.json#${namespace}`,
        githubPath: `app/${fileName}`,
      },
    }
    doc.version = bumpVersion(pageId, sourceHash, 0)
    registerPage(doc)
  }
}

function extractEmailTemplates() {
  /** @type {Record<string, Record<string, string>>} */
  const extraKeysByTemplate = {
    welcome: {
      headerTitle: 'Your subscription is active',
      bodyIntro: 'Your {company_name} subscription to {package_name} plan is now active.',
      nextStepsTitle: 'Next steps',
      textHeader: 'Your subscription is active',
    },
    provisioning: {
      headerTitle: 'Your workspace is ready',
      introTemplate:
        'Your {serviceName} workspace has finished provisioning. Use the links below to sign in and get started.',
      textHeader: 'Your workspace is ready',
    },
    'desk-credentials': {
      headerTitle: 'Your Work Desk sign-in details',
      introTemplate:
        'Hello, your {serviceName} workspace is ready. Use the credentials below for Work Desk and Work App only.',
      passwordLabel: 'Password (Work Desk & Work App)',
      workAppLabel: 'Work App URL',
      accountPortalLabel: 'Account portal',
      textHeader: 'Your Work Desk sign-in details',
    },
    'employee-portal-invite': {
      headerTitle: 'Welcome to {company}',
      introTemplate:
        'Hello {displayName}, you have been invited to join {company} on {serviceName}. Use the links below to activate your account.',
      workAppLabel: 'Work App',
      workDeskLabel: 'Work Desk',
      activationLabel: 'Activation link',
      onboardingLabel: 'Onboarding link',
      credentialsTitle: 'Sign-in credentials',
      emailLabel: 'Email',
      passwordLabel: 'Temporary password',
      textHeader: 'Employee portal invite',
    },
    'portal-password-reset': {
      headerTitle: 'Reset your service administrator password',
      introTemplate:
        'We received a request to reset the service administrator password for your {brandName} account portal. Use the button below to choose a new password. This link works once and expires in {expiresMinutes} minutes.',
      ctaButton: 'Set a new password',
      fallbackUrlNote: 'If the button does not work, copy and paste this URL into your browser:',
      ignoreNote: 'If you did not request this, you can ignore this email.',
      textHeader: 'Reset your service administrator password',
    },
    'tenant-admin-credentials': {
      headerTitle: 'Service administrator password',
      introTemplate:
        'Hello{adminName}, use this password to sign in to {serviceName} Account at account portal. Manage your company subscription, billing, users, and service settings here.',
      separatePasswordNote:
        'This is not your Work Desk or Work App password. Those credentials were sent in a separate email.',
      portalUrlLabel: 'Account portal URL',
      emailLabel: 'Sign-in email',
      passwordLabel: 'Service administrator password',
      changePasswordNote: 'Change this password after your first sign-in.',
      textHeader: 'Service administrator password',
    },
    'billing-payment-success': {
      headerTitle: 'Payment received',
      headlineSubtitle: '{planName} · {serviceName}',
      greetingTemplate: 'Hello, {contactName},',
      introTemplate:
        'We received your payment for {companyName}. Your subscription is active and you can continue setting up your workspace.',
      amountLabel: 'Amount',
      paidAtLabel: 'Paid at',
      paymentMethodLabel: 'Payment method',
      downloadReceiptLabel: 'Download receipt',
      viewInvoiceLabel: 'View invoice',
      continueOnboardingPrefix: 'Continue onboarding in the ',
      continueOnboardingLinkLabel: 'admin portal',
      stripeNote: 'You may also receive a receipt from Stripe. Questions? Contact {supportEmail}.',
      textHeader: 'Payment received',
    },
    'billing-invoice-paid': {
      headerTitle: 'Your invoice',
      greetingTemplate: 'Hello, {contactName},',
      introTemplate: 'Here is your paid invoice for {companyName}.',
      invoiceLabel: 'Invoice',
      amountPaidLabel: 'Amount paid',
      billingPeriodLabel: 'Billing period',
      paidAtLabel: 'Paid at',
      paymentMethodLabel: 'Payment method',
      viewInvoiceOnlineLabel: 'View invoice online',
      downloadPdfLabel: 'Download PDF',
      paymentReceiptLabel: 'Payment receipt',
      stripeNote: 'A copy may also be sent by Stripe. Support: {supportEmail}.',
      textHeader: 'Invoice paid',
    },
    'trial-start': {
      headerTitle: 'Your trial has started',
      headline: 'Your free trial is live',
      greetingHtml: 'Hi <strong>{name}</strong>,',
      introHtml:
        'Your 14-day Professional trial is now live. You have full access to all features{expirySuffix}.',
      ctaLabel: 'Choose a plan',
      textBody:
        'Hi {name},\n\nYour 14-day Professional trial is now live{expirySuffix}.\n\nChoose a plan: {upgradeUrl}\n\nThe {serviceName} Team',
    },
    'trial-day-7': {
      headerTitle: 'One week left in your trial',
      headline: '7 days left on your trial',
      greetingHtml: 'Hi <strong>{name}</strong>,',
      introHtml:
        'You have <strong>7 days remaining</strong> on your free trial. Choose a plan now to keep your dedicated server and all your data.',
      closingHtml: 'Upgrading takes less than 2 minutes — no downtime, no data migration.',
      ctaLabel: 'Choose your plan',
      textBody:
        'Hi {name},\n\n7 days remaining on your free trial. Upgrade to keep your server: {upgradeUrl}\n\nThe {serviceName} Team',
    },
    'trial-day-1': {
      headerTitle: 'Your trial ends tomorrow',
      headline: 'Trial ends tomorrow',
      greetingHtml: 'Hi <strong>{name}</strong>,',
      introHtml:
        '<strong>Your free trial expires tomorrow.</strong> Upgrade today to avoid losing access to your workspace and data.',
      closingHtml:
        'After the trial ends your server will remain powered on for 7 more days, but ERP access will be blocked until you upgrade.',
      ctaLabel: 'Upgrade now',
      textBody:
        'Hi {name},\n\nYour trial expires tomorrow. Upgrade now: {upgradeUrl}\n\nThe {serviceName} Team',
    },
    'trial-last-chance': {
      headerTitle: 'Last chance to upgrade',
      headline: "Don't lose your data",
      greetingHtml: 'Hi <strong>{name}</strong>,',
      introHtml:
        'Your trial ended 3 days ago. Your data is still safe on your dedicated server, but it will be <strong>powered off in 4 days</strong> if you do not upgrade.',
      closingHtml:
        'After powering off, you have 30 more days before the server and all data are permanently deleted.',
      ctaLabel: 'Upgrade and keep your data',
      textBody:
        'Hi {name},\n\nYour trial ended 3 days ago. Server will be powered off in 4 days. Upgrade now: {upgradeUrl}\n\nThe {serviceName} Team',
    },
    'trial-manual-receipt': {
      headerTitle: 'Application received',
      headline: 'Application received',
      greetingHello: 'Hello,',
      greetingNamed: 'Hello {name},',
      thankYouParagraph:
        'Thank you for submitting your trial application. Our team will review your organization details.',
      whatHappensNextTitle: 'What happens next?',
      stepReview: 'Review: We verify your organization details within 24 hours.',
      stepApproval: 'Approval: If approved, you receive an account setup link at your work email.',
      stepProvisioning: 'Provisioning: After signup, a dedicated workspace is prepared for your company.',
      referenceIdLabel: 'Reference ID',
      expectedReviewLabel: 'Expected review time',
      expectedReviewValue: 'Within 24 hours',
      supportLabel: 'Support',
      securityCallout:
        'Questions? Contact {supportEmail}. This message was sent automatically. Please do not reply.',
      footerNote: 'This message was sent automatically. Please do not reply.',
      textHeader: 'Application received',
    },
    'trial-manual-approved': {
      headerTitle: 'Application approved',
      headline: 'Application approved',
      greetingHello: 'Hello,',
      greetingNamed: 'Hello {name},',
      introTemplate:
        'Your trial application has been approved. Continue to verify your work email and complete account setup.',
      ctaLabel: 'Continue to account setup',
      copyLinkLabel: 'Or copy this link:',
      referenceIdLabel: 'Reference ID',
      linkExpiryLabel: 'Link expiry',
      linkExpiryValue: '{linkHours} hours',
      securityCallout:
        'This link is valid for {linkHours} hours. Do not forward it. Questions? Contact {supportEmail}.',
      footerNote: 'This message was sent automatically. Please do not reply.',
      textHeader: 'Application approved',
    },
    'trial-manual-rejected': {
      headerTitle: 'Application update',
      headline: 'Application update',
      greetingHello: 'Hello,',
      greetingNamed: 'Hello {name},',
      introTemplate:
        'Thank you for your interest in {serviceName}. After reviewing your trial application, we are unable to approve a free trial at this time.',
      operatorNoteLabel: 'Note:',
      referenceIdLabel: 'Reference ID',
      supportLabel: 'Support',
      securityCallout:
        'Questions? Contact {supportEmail}. This message was sent automatically. Please do not reply.',
      footerNote: 'This message was sent automatically. Please do not reply.',
      textHeader: 'Application update',
    },
    'trial-verify-reminder': {
      headerTitle: 'Continue trial verification',
      headline: 'Continue trial verification',
      greetingHello: 'Hello,',
      introTemplate:
        'Use the link below to continue your trial verification and submit your company details.',
      ctaLabel: 'Continue verification',
      copyLinkLabel: 'Or copy this link:',
      referenceIdLabel: 'Reference ID',
      securityCallout:
        'If you did not request a trial, contact {supportEmail}. This message was sent automatically. Please do not reply.',
      footerNote: 'This message was sent automatically. Please do not reply.',
      textHeader: 'Continue trial verification',
    },
    'employee-feedback': {
      headerTitle: 'Employee portal feedback',
      categoryLabel: 'Category',
      tenantLabel: 'Tenant',
      employeeLabel: 'Employee',
      replyToLabel: 'Reply-To',
    },
    'xero-migration-completed': {
      headerTitle: 'Migration completed',
      bodyTemplate: 'Tenant {tenantId} migration job {jobId} finished successfully.',
      textHeader: 'Xero migration completed',
    },
    'xero-migration-failed': {
      headerTitle: 'Migration failed',
      bodyTemplate: 'Job {jobId} failed for tenant {tenantId}.',
      textHeader: 'Xero migration failed',
    },
    'xero-token-expired': {
      headerTitle: 'Reconnect Xero',
      bodyTemplate: 'The Xero connection {connectionId} for tenant {tenantId} needs re-authorization.',
      textHeader: 'Reconnect Xero',
    },
    'xero-rate-limit-paused': {
      headerTitle: 'Migration paused',
      bodyTemplate: 'Job {jobId} was paused due to Xero API rate limits. It will resume when limits allow.',
      textHeader: 'Xero migration paused',
    },
  }

  for (const key of EMAIL_TEMPLATE_KEYS) {
    const sourceFile = EMAIL_TEMPLATE_SOURCE_FILE[key] ?? `${key}.ts`
    const tsPath = join(PATHS.emailTemplates, sourceFile)
    if (!existsSync(tsPath)) continue
    const src = readFileSync(tsPath, 'utf8')
    /** @type {Record<string, string>} */
    const keys = {}
    keys.subject = extractEmailSubject(key, src)
    Object.assign(keys, extraKeysByTemplate[key] ?? {})
    keys._sourceNote = `Extracted from ${key}.ts — full HTML/text managed in web-i18n locales; template code uses locale resolver.`
    const pageId = `email.${key.replace(/-/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${key}.page.json`
    const doc = {
      pageId,
      surface: 'email',
      route: null,
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      keys,
      meta: {
        productRepo: 'infra-email',
        sourcePath: `packages/email-templates/src/${sourceFile}`,
        githubPath: `email/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function extractEmailSubject(templateKey, src) {
  if (templateKey === 'otp') return 'Your verification code'
  const m = src.match(/subject:\s*['"`]([^'"`]+)['"`]/)
  if (m) return m[1]
  const m2 = src.match(/build\w+Subject\([^)]*\)/)
  return m2 ? `Dynamic subject (${templateKey})` : `${templateKey} email`
}

function extractLegalDocs() {
  if (!existsSync(PATHS.docsLegal)) {
    console.warn('skip docs: legal folder not found')
    return
  }
  for (const name of readdirSync(PATHS.docsLegal)) {
    if (!/\.(mdx|md)$/.test(name)) continue
    const slug = name.replace(/\.(mdx|md)$/, '')
    const full = readFileSync(join(PATHS.docsLegal, name), 'utf8')
    const titleMatch = full.match(/^title:\s*['"]?([^'"\n]+)/m)
    const title = titleMatch?.[1]?.trim() ?? slug
    const body = full.replace(/^---[\s\S]*?---\s*/m, '').trim()
    const keys = { title, body: body.slice(0, 5000) }
    const pageId = `docs.legal.${slug.replace(/-/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${slug}.page.json`
    const doc = {
      pageId,
      surface: 'docs',
      route: `/legal/${slug}`,
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      reviewRequired: true,
      keys,
      meta: {
        productRepo: 'web-public',
        sourcePath: `apps/docs/src/content/docs/legal/${name}`,
        githubPath: `docs/legal/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

/** Hero copy for static marketing pages (route key → fields). */
const WWW_HERO_OVERRIDES = {
  trial: {
    hero_title: 'Try Pro free for 14 days',
    hero_subtitle: 'Verify your work email to continue to sign up',
    whyWorkEmailLabel: 'Why work email?',
    bullet1: 'Full Pro access for 14 days',
    bullet2: 'No credit card required',
    bullet3: 'Your server and data stay in place after trial',
  },
  about: {
    hero_title: 'Work moves here.',
    hero_subtitle: 'Built in Singapore for teams that move fast',
    hero_intro:
      '{brand} is a workflow-first ERP platform. We build the layer between your data and the people who need to act on it—approvals, automation, and audit trails included.',
    missionTitle: 'Our mission',
    valuesTitle: 'What we believe',
    ctaTitle: 'Ready to see Vouus in action?',
    ctaBody: '14-day Pro trial or a personalised demo with our team.',
    missionParagraph1:
      'Most ERP platforms are systems of record. They store what happened. Vouus stores what happened and moves work to whoever needs to act next.',
    missionParagraph2:
      'We built Vouus for the teams who spend too much time chasing approvals, reconciling spreadsheets, and explaining last month\'s numbers. Our mission is to give those teams a platform where work has a spine—connected steps, clear ownership, and a full audit trail.',
    seaTitle: 'Why Singapore & Southeast Asia',
    sinceParagraph:
      'Since 2021 in Singapore—workflow-first ERP from core HR and finance to enterprise infrastructure, eInvoice compliance, and mobile operations.',
    legalParagraph:
      'Vouus is a product of PREGO Labs Pte. Ltd., incorporated in Singapore. Our platform serves businesses across Southeast Asia and beyond.',
    hero_talk_cta: 'Talk to us',
    hero_trial_cta: 'Start free trial',
  },
  contact: {
    hero_title: 'Get in touch',
    hero_subtitle:
      "Whether you're evaluating the platform, ready to start, or need help with an existing account—we reply within one business day.",
    faqTitle: 'Quick answers',
    channels_0_title: 'Sales',
    channels_0_description: 'Discuss pricing, migration support, or a custom Enterprise plan.',
    channels_0_cta: 'Book a Demo',
    channels_1_title: 'General enquiries',
    channels_1_description: 'Email our team directly for questions about the platform, billing, or partnerships.',
    channels_1_cta: 'Email us',
    channels_2_title: 'Technical support',
    channels_2_description:
      'For existing customers with platform issues, visit our documentation and help centre.',
    channels_2_cta: 'Open docs',
    channels_3_title: 'Enterprise & partnerships',
    channels_3_description:
      'Dedicated infrastructure, custom SLA, on-premise deployment, or technology partnerships.',
    channels_3_cta: 'Contact enterprise sales',
    faq_0_q: 'How quickly will I hear back?',
    faq_0_a:
      'Sales enquiries are typically responded to within one business day. For existing customers, support response times depend on your plan tier.',
    faq_1_q: 'Is there a free trial?',
    faq_2_q: 'I want to migrate from an existing ERP. Who should I contact?',
    faq_2_a:
      'Reach out via the Sales channel above. Our team will assess your current setup and guide you through the migration process.',
    legalNote:
      'Vouus is a product of PREGO Labs Pte. Ltd., incorporated in Singapore. For legal and privacy matters, see our Privacy Policy and Terms of Service.',
    privacyLinkLabel: 'Privacy Policy',
    termsLinkLabel: 'Terms of Service',
  },
  blog: {
    hero_title: 'Blog',
    hero_subtitle: 'Business automation, ERP, and operational insights.',
    emptyTitle: 'Articles coming soon',
    emptyBody:
      "We're preparing guides on business automation, workflow design, and ERP best practices. Be the first to know when we publish.",
    emptyTrialCta: 'Start free trial',
    emptyTalkCta: 'Talk to us',
  },
}

function applyWwwHeroOverrides(pageKey, keys) {
  const hero = WWW_HERO_OVERRIDES[pageKey]
  if (hero) Object.assign(keys, hero)
}

function flattenEightColumnPayload(payload) {
  /** @type {Record<string, string>} */
  const keys = {}
  if (payload?.hero) {
    if (payload.hero.title) keys.hero_title = payload.hero.title
    if (payload.hero.description) keys.hero_description = payload.hero.description
  }
  if (Array.isArray(payload?.features)) {
    payload.features.forEach((feature, index) => {
      if (feature?.title) keys[`features_${index}_title`] = feature.title
      if (feature?.description) keys[`features_${index}_description`] = feature.description
    })
  }
  if (Array.isArray(payload?.sections)) {
    payload.sections.forEach((section, index) => {
      if (section?.headline) keys[`sections_${index}_headline`] = section.headline
      if (section?.body) keys[`sections_${index}_body`] = section.body
    })
  }
  if (Array.isArray(payload?.faq)) {
    payload.faq.forEach((item, index) => {
      if (item?.q) keys[`faq_${index}_q`] = item.q
      if (item?.a) keys[`faq_${index}_a`] = item.a
    })
  }
  if (payload?.cta) {
    if (payload.cta.title) keys.cta_title = payload.cta.title
    if (payload.cta.description) keys.cta_description = payload.cta.description
  }
  return keys
}

function mergeMarketingSnapshotEightSectionKeys() {
  const snapshotPath = join(PATHS.marketingWeb, 'lib', 'marketing-pages-cp-snapshot.json')
  if (!existsSync(snapshotPath)) {
    console.warn('skip www eight-section merge: marketing-pages-cp-snapshot.json not found')
    return
  }
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'))
  for (const [pageKey, page] of Object.entries(snapshot.pages ?? {})) {
    if (page.layout_type !== 'eight_section' || !page.content_payload) continue
    const fileName = `${pageKey.replace(/\//g, '_')}.page.json`
    const enPath = join(PATHS.sourcesEn, 'www', fileName)
    if (!existsSync(enPath)) continue
    const doc = JSON.parse(readFileSync(enPath, 'utf8'))
    Object.assign(doc.keys, flattenEightColumnPayload(page.content_payload))
    const sourceHash = hashJson(doc.keys)
    doc.sourceHash = sourceHash
    doc.version = bumpVersion(doc.pageId, sourceHash, Math.max(0, (doc.version ?? 1) - 1))
    writeJson(enPath, doc)
    console.log(`extract: merged eight-section keys for www/${fileName}`)
  }
}

function extractMarketingRegistry() {
  const cpRegistry = join(ERP_LABS_ROOT, 'infra-control-plane', 'src', 'marketing-pages', 'registry.ts')
  if (existsSync(cpRegistry)) {
    extractMarketingFromCpRegistry(cpRegistry)
    mergeMarketingSnapshotEightSectionKeys()
    return
  }
  const registryPath = join(PATHS.marketingWeb, 'content', 'registry.json')
  if (!existsSync(registryPath)) {
    const alt = join(PATHS.marketingWeb, 'lib', 'marketing-pages-registry.json')
    if (!existsSync(alt)) {
      console.warn('skip www: marketing registry not found')
      return
    }
    extractMarketingFromRegistry(alt)
    return
  }
  extractMarketingFromRegistry(registryPath)
}

function extractMarketingFromCpRegistry(tsPath) {
  const src = readFileSync(tsPath, 'utf8')
  /** @type {Array<{ pageKey: string, path: string, meta_title: string, meta_description: string }>} */
  const entries = []

  const eightRe =
    /eightSection\(\s*'([^']+)',\s*\n?\s*'((?:\\'|[^'\\])*)',\s*\n?\s*'((?:\\'|[^'\\])*)'/g
  for (const m of src.matchAll(eightRe)) {
    entries.push({
      pageKey: m[1],
      path: `/${m[1]}`,
      meta_title: m[2].replace(/\\'/g, "'"),
      meta_description: m[3].replace(/\\'/g, "'"),
    })
  }

  const objectRe =
    /page_key:\s*'([^']+)'[\s\S]*?path:\s*'([^']+)'[\s\S]*?meta_title:\s*'((?:\\'|[^'\\])*)'[\s\S]*?meta_description:\s*\n?\s*'((?:\\'|[^'\\])*)'/g
  for (const m of src.matchAll(objectRe)) {
    if (entries.some((e) => e.pageKey === m[1])) continue
    entries.push({
      pageKey: m[1],
      path: m[2],
      meta_title: m[3].replace(/\\'/g, "'"),
      meta_description: m[4].replace(/\\'/g, "'"),
    })
  }

  for (const entry of entries) {
    const keys = {
      path: entry.path,
      meta_title: entry.meta_title,
      meta_description: entry.meta_description,
    }
    applyWwwHeroOverrides(entry.pageKey, keys)
    const pageId = `www.${entry.pageKey.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${entry.pageKey.replace(/\//g, '_')}.page.json`
    const doc = {
      pageId,
      surface: 'www',
      route: entry.path,
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      keys,
      meta: {
        productRepo: 'infra-control-plane',
        sourcePath: `src/marketing-pages/registry.ts ${entry.pageKey}`,
        githubPath: `www/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function extractMarketingFromRegistry(registryPath) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  const pages = Array.isArray(registry) ? registry : registry.pages ?? []
  for (const page of pages) {
    const pageKey = page.page_key ?? page.key ?? page.id
    if (!pageKey) continue
    const keys = {
      path: page.path ?? '/',
      meta_title: page.meta_title ?? page.title ?? pageKey,
      meta_description: page.meta_description ?? '',
    }
    applyWwwHeroOverrides(pageKey, keys)
    if (page.content_payload && typeof page.content_payload === 'object') {
      keys.content = page.content_payload
    }
    const pageId = `www.${pageKey.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const sourceHash = hashJson(keys)
    const fileName = `${pageKey}.page.json`
    const doc = {
      pageId,
      surface: 'www',
      route: page.path ?? '/',
      version: bumpVersion(pageId, sourceHash, 0),
      sourceHash,
      keys,
      meta: {
        productRepo: 'web-public',
        sourcePath: `apps/marketing-web (registry) ${pageKey}`,
        githubPath: `www/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function extractAccountPlaceholders() {
  const pages = [
    {
      pageId: 'account.auth.signup',
      route: '/signup',
      keys: {
        title: 'Sign up',
        titleEmailLocked: 'Email',
        intro: 'Create your account to get started.',
        introEmailLocked:
          "We'll send a verification code to this address so you can finish creating your account.",
        emailLabel: 'Email address',
        emailLockedHint: 'This address was verified on pregoi.com and cannot be changed here.',
        submit: 'Send verification code',
        submitting: 'Sending…',
      },
    },
    {
      pageId: 'account.auth.signin',
      route: '/sign-in',
      keys: {
        title: 'Sign in',
        titleLogin: 'Log in',
        titleGetStarted: 'Get started',
        titlePortalPasswordSetup: 'Set up service administrator password',
        descriptionDefault: 'Sign in with the email registered for your workspace.',
        descriptionEmailLocked: "We'll send a verification code to this address to sign in.",
        descriptionPackageFunnel: 'Sign in or create an account to continue to payment.',
        descriptionPortalPassword:
          'Enter your email. We will send a verification code, then you can create your service administrator password.',
        descriptionLoginGate:
          'Sign in with your email and password. We will email a verification code next.',
        submit: 'Continue',
        submitLogin: 'Log in',
        submitSendCode: 'Send verification code',
        submitting: 'Sending…',
        submittingLogin: 'Logging in…',
        submittingVerify: 'Verifying…',
        emailLabel: 'Email address',
        passwordLabel: 'Password',
      },
    },
    {
      pageId: 'account.auth.verify',
      route: '/signup/verify',
      keys: {
        title: 'Verify your identity',
        intro: 'Please enter the one-time code sent to your email to continue.',
        emailPrefix: 'Email:',
        sendUncertainBanner:
          'We could not confirm delivery, but a verification email may already be in your inbox. Enter the latest code below.',
        verify: 'Verify',
        verifying: 'Verifying…',
        loading: 'Loading…',
      },
    },
    {
      pageId: 'account.onboarding.company',
      route: '/onboarding/company',
      keys: ONBOARDING_COMPANY_KEYS,
    },
    {
      pageId: 'account.onboarding.platform',
      route: '/onboarding/platform',
      keys: ONBOARDING_PLATFORM_KEYS,
    },
    {
      pageId: 'account.onboarding.review',
      route: '/onboarding/review',
      keys: ONBOARDING_REVIEW_KEYS,
    },
    {
      pageId: 'account.onboarding.launch',
      route: '/onboarding/launch',
      keys: ONBOARDING_LAUNCH_KEYS,
    },
    {
      pageId: 'account.onboarding.dashboard',
      route: '/onboarding',
      keys: ONBOARDING_DASHBOARD_KEYS,
    },
    {
      pageId: 'account.onboarding.provision_email',
      route: '/onboarding/launch',
      keys: ONBOARDING_PROVISION_EMAIL_KEYS,
    },
    {
      pageId: 'account.onboarding.payment_success',
      route: '/onboarding/payment-success',
      keys: ONBOARDING_PAYMENT_SUCCESS_KEYS,
    },
    {
      pageId: 'account.billing.upgrade',
      route: '/billing/upgrade',
      keys: {
        title: 'Upgrade package',
        subtitle: 'Choose a higher plan for your workspace.',
        bodyNote: 'Your dedicated server and data stay in place when you move to a higher plan.',
        submit: 'Upgrade',
        backToBilling: '← Back to billing',
      },
    },
    {
      pageId: 'account.billing.upgrade_success',
      route: '/billing/upgrade/success',
      keys: {
        titlePayment: 'Payment successful',
        titleInline: 'Package updated',
        body: 'Subscription details may take a minute to sync from Stripe.',
        bodyWithPlan: 'Your workspace is moving to {plan}. Subscription details may take a minute to sync from Stripe.',
        cta: 'View billing',
      },
    },
    {
      pageId: 'account.shell.dashboard',
      route: '/dashboard',
      keys: {
        title: 'Dashboard',
        subtitle: 'Overview of your account and services',
        subtitleSignedIn: 'Welcome, {name} — manage your subscription, portals, and usage.',
      },
    },
    {
      pageId: 'account.shell.common',
      route: null,
      keys: SHELL_COMMON_KEYS,
    },
    {
      pageId: 'account.shell.billing',
      route: '/billing',
      keys: {
        title: 'Billing',
        subtitle: 'Manage your subscription, payment method, and history',
        subtitleWithEmail: 'Manage your subscription, payment method, and history for {email}.',
      },
    },
    {
      pageId: 'account.shell.profile',
      route: '/profile',
      keys: {
        title: 'Profile',
        subtitle: 'Your account and organization details.',
      },
    },
    {
      pageId: 'account.shell.integrations',
      route: '/integrations',
      keys: SHELL_INTEGRATIONS_KEYS,
    },
    {
      pageId: 'account.shell.usage',
      route: '/usage',
      keys: {
        title: 'Service Usage',
        subtitle: 'Track quotas for storage, email, AI tokens, and employee portal seats on your plan.',
      },
    },
    {
      pageId: 'account.shell.users',
      route: '/users',
      keys: SHELL_USERS_KEYS,
    },
    {
      pageId: 'account.shell.backup',
      route: '/backup',
      keys: SHELL_BACKUP_KEYS,
    },
    {
      pageId: 'account.integrations.xero_migration',
      route: '/integrations/xero/migration/:jobId',
      keys: XERO_MIGRATION_KEYS,
    },
  ]
  for (const p of pages) {
    const sourceHash = hashJson(p.keys)
    const fileName = `${p.pageId.split('.').slice(1).join('.')}.page.json`
    const doc = {
      pageId: p.pageId,
      surface: 'account',
      route: p.route,
      version: bumpVersion(p.pageId, sourceHash, 0),
      sourceHash,
      keys: p.keys,
      meta: {
        productRepo: 'core-platform',
        sourcePath: `apps/admin-web ${p.route}`,
        githubPath: `account/${fileName}`,
      },
    }
    registerPage(doc)
  }
}

function main() {
  ensureDir(PATHS.sourcesEn)
  extractEmployeeWeb()
  extractEmailTemplates()
  extractLegalDocs()
  extractMarketingRegistry()
  extractAccountPlaceholders()

  const manifest = loadPagesManifest()
  manifest.pages = extractedPages.map((p) => ({
    pageId: p.pageId,
    surface: p.surface,
    route: p.route,
    version: p.version,
    sourceHash: p.sourceHash,
    reviewRequired: p.reviewRequired ?? false,
    githubPath: p.meta.githubPath,
    sourcePath: p.meta.sourcePath,
  }))
  savePagesManifest(manifest)
  console.log(`extract-from-apps: wrote ${extractedPages.length} pages`)
}

main()
