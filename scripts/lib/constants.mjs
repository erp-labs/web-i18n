#!/usr/bin/env node
/**
 * Shared constants for web-i18n scripts.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = join(__dirname, '..', '..')
export const ERP_LABS_ROOT = join(REPO_ROOT, '..')

export const PATHS = {
  corePlatform: join(ERP_LABS_ROOT, 'core-platform'),
  webPublic: join(ERP_LABS_ROOT, 'web-public'),
  infraEmail: join(ERP_LABS_ROOT, 'infra-email'),
  employeeWebDict: join(ERP_LABS_ROOT, 'core-platform', 'apps', 'employee-web', 'dictionaries'),
  adminWeb: join(ERP_LABS_ROOT, 'core-platform', 'apps', 'admin-web'),
  marketingWeb: join(ERP_LABS_ROOT, 'web-public', 'apps', 'marketing-web'),
  docsLegal: join(ERP_LABS_ROOT, 'web-public', 'apps', 'docs', 'src', 'content', 'docs', 'legal'),
  emailTemplates: join(ERP_LABS_ROOT, 'infra-email', 'packages', 'email-templates', 'src'),
  sourcesEn: join(REPO_ROOT, 'sources', 'en'),
  locales: join(REPO_ROOT, 'locales'),
  manifestPages: join(REPO_ROOT, 'manifest', 'pages.json'),
  manifestLocales: join(REPO_ROOT, 'manifest', 'locales.json'),
  versions: join(REPO_ROOT, 'versions'),
  indexKeywords: join(REPO_ROOT, 'index', 'keywords.json'),
}

export function loadLocales() {
  const raw = JSON.parse(readFileSync(PATHS.manifestLocales, 'utf8'))
  return raw.locales.map((l) => l.code)
}

export function loadNonEnLocales() {
  return loadLocales().filter((c) => c !== 'en')
}

/** Template key → source file when not `{key}.ts` (multi-template modules). */
export const EMAIL_TEMPLATE_SOURCE_FILE = {
  'trial-start': 'trial.ts',
  'trial-day-7': 'trial.ts',
  'trial-day-1': 'trial.ts',
  'trial-last-chance': 'trial.ts',
  'trial-manual-receipt': 'trial-manual.ts',
  'trial-manual-approved': 'trial-manual.ts',
  'trial-manual-rejected': 'trial-manual.ts',
  'trial-verify-reminder': 'trial-manual.ts',
  'xero-migration-completed': 'xero-bridge.ts',
  'xero-migration-failed': 'xero-bridge.ts',
  'xero-token-expired': 'xero-bridge.ts',
  'xero-rate-limit-paused': 'xero-bridge.ts',
}

export const EMAIL_TEMPLATE_KEYS = [
  'otp',
  'provisioning',
  'welcome',
  'desk-credentials',
  'employee-portal-invite',
  'portal-password-reset',
  'tenant-admin-credentials',
  'billing-payment-success',
  'billing-invoice-paid',
  'trial-start',
  'trial-day-7',
  'trial-day-1',
  'trial-last-chance',
  'trial-manual-receipt',
  'trial-manual-approved',
  'trial-manual-rejected',
  'trial-verify-reminder',
  'employee-feedback',
  'xero-migration-completed',
  'xero-migration-failed',
  'xero-token-expired',
  'xero-rate-limit-paused',
]

export const APP_ROUTE_BY_NAMESPACE = {
  common: null,
  signin: '/{companyId}/{locale}/signin',
  signup: '/{companyId}/{locale}/signup',
  onboarding: '/{companyId}/{locale}/onboarding',
  auth: '/{companyId}/{locale}/auth',
  passcode: '/{companyId}/{locale}/passcode',
  profile: '/{companyId}/{locale}/profile',
  invoices: '/{companyId}/{locale}/invoices',
  expenses: '/{companyId}/{locale}/expenses',
  leaves: '/{companyId}/{locale}/leaves',
  myAi: '/{companyId}/{locale}/my-ai',
}
