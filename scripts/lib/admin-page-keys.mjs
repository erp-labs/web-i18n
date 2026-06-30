/** Canonical EN keys for admin-web account pages (synced to extract-from-apps). */

export const SHELL_BACKUP_KEYS = {
  pageTitle: 'Backup',
  pageDescription:
    'View automated backup status, retention policy, and recovery points for your organization.',
  organizationSelector: 'Organization',
  noOrganizations: 'No organizations linked to your account.',
  loadError: 'Could not load backup status. Please try again.',
  maintenanceError:
    'Backup status is temporarily unavailable. Our team has been notified — please try again later or contact Support.',
  forbiddenError: 'You do not have access to backup status for this organization.',
  statusHeroTitle: 'Backup status',
  rpoLabel: 'Recovery point objective (RPO)',
  rtoLabel: 'Recovery time objective (RTO)',
  lastBackupLabel: 'Last logical backup',
  lastSnapshotLabel: 'Last VM snapshot',
  planLabel: 'Plan',
  never: 'Not yet available',
  pausedUntil: 'Autopilot paused until',
  rpoStatus_ok: 'On schedule',
  rpoStatus_catch_up: 'Catching up',
  rpoStatus_breach: 'Attention needed',
  rpoStatusHint_ok: 'Your latest backup meets the RPO target for your plan.',
  rpoStatusHint_catch_up: 'A backup is overdue but Autopilot is scheduling a catch-up run.',
  rpoStatusHint_breach: 'Backups are significantly overdue. Contact Support if this persists.',
  byoBannerTitle: 'Self-managed hosting',
  byoBannerBody:
    'Your organization uses Enterprise BYO hosting. Database and infrastructure backups are your responsibility. Vouus platform backups do not apply to your ERP VM.',
  byoLearnMore: 'View credential governance',
  policyTitle: 'Your backup policy',
  policyByoNote:
    'Reference policy for Vouus Managed hosting. Your BYO environment is not covered by platform backups.',
  layerALabel: 'Logical backups (Layer A)',
  layerALabelDetail: 'Database and weekly site files — all plans',
  layerBEnabled: 'Included on your plan (monthly, up to 2 retained)',
  layerBDisabled: 'Available on Business and Enterprise plans',
  logicalIntervalTemplate: 'Logical backups scheduled every {hours} hours',
  retentionDaysTemplate: '{days} days in secure cloud storage',
  siteFilesIntervalTemplate: 'Site files included every {days} days',
  breachContactSupport: 'Contact Support now',
  catchUpContactSupport: 'Contact Support',
  upsellLayerBTitle: 'Need faster recovery and VM snapshots?',
  upsellLayerBBody:
    'Business and Enterprise plans include Layer B VM snapshots and shorter recovery time objectives (RTO).',
  upsellLayerBLink: 'View upgrade options',
  jobKindLabels_tenant_logical: 'Logical backup',
  jobKindLabels_tenant_snapshot: 'VM snapshot',
  jobKindLabels_restore_new_vm: 'Restore (new VM)',
  jobKindLabels_restore_in_place: 'Restore (in place)',
  recoveryPointsTitle: 'Recovery points',
  recoveryPointsEmpty: 'No verified recovery points yet. Autopilot will create the first backup soon.',
  recoveryPointsColumns_capturedAt: 'Captured',
  recoveryPointsColumns_layer: 'Layer',
  recoveryPointsColumns_kind: 'Type',
  recoveryPointsColumns_verified: 'Verified',
  recoveryPointsColumns_size: 'Approx. size',
  verifiedYes: 'Yes',
  verifiedNo: 'Pending',
  recentActivityTitle: 'Recent backup activity',
  recentActivityEmpty: 'No recent backup jobs.',
  recentActivityColumns_kind: 'Job',
  recentActivityColumns_status: 'Status',
  recentActivityColumns_finishedAt: 'Finished',
  howItWorksTitle: 'How backups work',
  howItWorksLayers_0_title: 'Layer A — Logical backup',
  howItWorksLayers_0_body:
    'Frappe bench backup exports your database (and weekly site files) to encrypted cloud storage. Runs automatically on an Autopilot schedule.',
  howItWorksLayers_1_title: 'Layer B — VM snapshot',
  howItWorksLayers_1_body:
    'Business and Enterprise plans also receive full VM snapshots for faster recovery when the server itself fails.',
  howItWorksLayers_2_title: 'Layer C — Golden template',
  howItWorksLayers_2_body:
    'Platform golden images help rebuild VMs. They do not replace your ERP data — Layer A and B protect your tenant data.',
  recoveryGuideTitle: 'Recovery guide',
  recoveryGuideIntro:
    'Restore operations are performed by Vouus Support to protect your data. When you need recovery, contact Support with your organization and the recovery point timestamp from the table above.',
  recoveryScenarios_0_title: 'Data corruption (VM healthy)',
  recoveryScenarios_0_body:
    'Support can restore from a Layer A recovery point to the current or a new VM.',
  recoveryScenarios_1_title: 'Server or disk failure',
  recoveryScenarios_1_body:
    'Support uses Restore to New VM — Layer B snapshot when available, otherwise Layer A plus a fresh VM.',
  recoveryScenarios_2_title: 'Security incident',
  recoveryScenarios_2_body:
    'Support can restore an older verified recovery point to a clean VM. Report the incident promptly.',
  securityTitle: 'Security & retention',
  securityBullets_0:
    'Backup artifacts are stored in tenant-isolated cloud storage — not downloadable from this portal.',
  securityBullets_1:
    'Manifest checksums verify backup integrity; optional HMAC signing on platform side.',
  securityBullets_2: 'Expired backups are purged automatically per your plan retention period.',
  securityBullets_3:
    'Restore requests are audited; subdomain confirmation prevents mistaken restores.',
  securityBullets_4: 'The platform periodically verifies restore readiness (DiRT sampling).',
  contactSupport: 'Contact Support',
  contactSupportHint:
    'Include your organization name and desired recovery point when requesting restore.',
}

export const SHELL_COMMON_KEYS = {
  loading: 'Loading…',
  loadOrganizationsError: 'Could not load your organizations.',
  loadOrganizationError: 'Could not load your organization.',
  loadBillingError: 'Could not load billing details. Try again or contact support.',
  loadIntegrationsError: 'Failed to load integrations.',
  selectLanguage: 'Select language',
  language: 'Language',
  retry: 'Retry',
  networkError: 'Network error. Please try again.',
  networkErrorCheckConnection: 'Network error. Please check your connection.',
  networkErrorCheckConnectionRetry: 'Network error. Please check your connection and try again.',
  networkErrorLoadingUsage: 'Network error loading usage.',
  networkErrorBillingPortal: 'Network error while opening the billing portal.',
}

export const SHELL_USERS_KEYS = {
  title: 'Users',
  subtitle: 'Manage employees who can sign in to your employee portal.',
  retryUserSeed: 'Retry user seed',
  retryingUserSeed: 'Retrying…',
  seedPendingHint:
    'Employee invites from onboarding are waiting to be seeded. Use Retry user seed below once provisioning finishes.',
}

export const SHELL_INTEGRATIONS_KEYS = {
  title: 'Integrations',
  subtitle: 'Connect external tools to your workspace.',
  loadError: 'Failed to load integrations.',
}

export const ONBOARDING_COMPANY_KEYS = {
  title: 'Company',
  submit: 'Continue',
  submitNext: 'Next',
  submitting: 'Loading…',
  companyNameLabel: 'Company name (full legal name)',
  companyNamePlaceholder: 'company pte ltd',
  subdomainLabel: 'Subdomain',
  subdomainRules:
    'Lowercase letters (a-z), numbers (0-9), and hyphens (-), Max 10 Character are allowed',
  subdomainAvailable: 'This subdomain name is available.',
  subdomainUnavailable: 'This subdomain name is unavailable.',
  subdomainChecking: 'Checking…',
  employeePortalSectionTitle: 'Employee portal',
  includeAdminLabel: 'Also give me access to the employee portal using my admin email',
  adminEmailNotLoaded:
    "We couldn't load your admin email yet. Refresh the page, or sign out and sign in again.",
  emailPlaceholder: 'teammate@company.com',
  firstNamePlaceholder: 'First name',
  lastNamePlaceholder: 'Last name',
  addPeople: 'Add people',
  removeInviteRowAria: 'Remove this invite row',
  removeAdminRowAria: 'Uncheck the option above to remove your admin row',
  fieldLabelCompany: 'Company name',
  fieldLabelSubdomain: 'Subdomain',
  fieldLabelEmployeePortal: 'Employee portal',
  inviteEmailFieldLabel: 'Invite {index} — Email',
  inviteFirstNameFieldLabel: 'Invite {index} — First name',
  inviteLastNameFieldLabel: 'Invite {index} — Last name',
  employeePortalIntro: "Add people who should sign in to your company's employee portal.",
}

export const ONBOARDING_PLATFORM_KEYS = {
  title: 'Platform',
  intro: 'Choose your ERP stack and cloud provider for this workspace.',
  submit: 'Continue',
  submitting: 'Continuing…',
  recommendedSetupLabel: 'Recommended setup:',
  recommendedSetupIntro: 'For the fastest, most reliable launch today, we recommend',
  recommendedSetupOutro: 'Additional ERP and cloud options will be available soon.',
  optionNotAvailableNotice:
    'This option is not available yet. Please select the Recommended option, or contact support for early access.',
  badgeRecommended: 'Recommended',
  badgeComingSoon: 'Coming soon',
  erpSectionHeading: 'Select ERP solution:',
  cloudSectionHeading: 'Select cloud provider:',
}

export const ONBOARDING_REVIEW_KEYS = {
  title: 'Review & Confirm',
  intro: 'Check your company details before we create your workspace and start provisioning.',
  submit: 'Start launch',
  submitting: 'Starting…',
  submitUnavailable: 'Start Launch unavailable',
  backToEdit: 'Back to edit',
  labelCompanyName: 'Company name',
  labelSubdomain: 'Subdomain',
  labelEmployeePortal: 'Employee portal',
  labelErpSolution: 'ERP solution',
  labelCloudProvider: 'Cloud provider',
  editCompany: 'Edit company',
  editPlatform: 'Edit platform',
}

export const ONBOARDING_LAUNCH_KEYS = {
  title: 'Almost there',
  titleProgress: 'Setup progress',
  titleVerifying: 'Verifying server state',
  titleSettingUp: 'Setting up your server',
  titleStopped: 'Setup stopped',
  minimalIntro:
    'Your workspace is being prepared. You can close this tab — we will email you when everything is ready.',
  preparingWorkspace: 'Preparing your workspace…',
  verifyingServerEllipsis: 'Verifying server state…',
  fetchingStatus: 'Fetching live provisioning status…',
  reconnecting: 'Trying to reconnect to the control plane…',
  workspaceReadyTitle: 'Your workspace will be ready shortly.',
  workspaceReadyBody:
    'Please feel free to activate your tenant on your subdomain at your earliest convenience. Once the setup is confirmed, we will send all necessary access details—including your workspace links, API gateway, and portal URLs—directly to your registered email address, so please be sure to check your inbox.',
  waitingSelfTestIntro:
    'Your workspace is provisioned; we are running API self-tests and final gateway checks. You can close this tab — we will email you when everything is ready.',
  waitingVerifyIntro:
    'Provisioning finished; we are verifying DNS, secure tunnel connectivity, gateways, and final handoff. This usually completes within a minute.',
  gracePeriodIntro:
    'Your server was created. We are verifying installation status — this may take up to a minute.',
  awaitingServerIntro:
    'Your server is booting and connecting to our platform. This usually takes a few minutes — please keep this tab open.',
  reconnectBannerIntro:
    'Connection to the control plane is unstable. This page will keep retrying. If it lasts several minutes, contact',
  reconnectBannerIncludeReference: 'and include this reference:',
  reconnectBannerReferenceFallback: 'with your support reference (shown when available).',
  earlyPipelineHintIntro:
    'This label is the first install stage until the server pipeline reports step events to the control plane. If it stays here for several minutes, the workflow may be queued or blocked—use your support reference or contact',
  pipelineNeverTriggered:
    'Provisioning was accepted, but the platform did not start the install pipeline. The progress bar may stay near the first step. Contact {supportEmail}{traceSuffix}',
  labelFailedAt: 'Failed at',
  labelSupportReference: 'Support reference',
  openTenant: 'Open tenant',
  readinessTitle: 'Readiness checks',
  readinessVerifying: 'Verifying your workspace…',
  readiness_dns_a: 'DNS records',
  readiness_frappe_http: 'ERP portal',
  readiness_admin_api: 'ERP API',
  readiness_zuplo_route: 'Gateway route',
  readiness_zuplo_smoke: 'Gateway API smoke',
  readiness_employee_portal: 'Employee portal',
  readiness_employee_portal_auth: 'Employee portal auth',
  readiness_api_self_test: 'API self-test',
}

export const ONBOARDING_DASHBOARD_KEYS = {
  loadingLabel: 'Loading onboarding',
  title: 'Welcome to Prego!',
  intro: 'Complete the following steps to set up your account and launch your server.',
  signedInAs: 'Signed in as',
  companySetupTitle: 'Company Setup',
  companySetupCompleted: 'Completed',
  companySetupPending: 'Set up your company information',
  launchServerTitle: 'Launch Server',
  launchServerRunning: 'Server is running',
  launchServerReady: 'Launch your Prego server',
  launchServerLocked: 'Complete Step 1 first',
  edit: 'Edit',
  start: 'Start',
  dashboard: 'Dashboard',
  launch: 'Launch',
  needHelp: 'Need help?',
  contactSupport: 'Contact our support team',
}

export const ONBOARDING_PROVISION_EMAIL_KEYS = {
  sectionTitle: 'Email delivery',
  welcomeLabel: 'Welcome email:',
  deskLabel: 'Desk login details:',
  employeeInvitesLabel: 'Employee portal invites:',
  sent: 'Sent',
  pending: 'Pending',
  deskTierNote:
    '(Managed Tier 0: use your admin email for Work Desk — no ERP super-user password in email. Open Work Desk from the dashboard after sign-in.)',
  accountEmailHint:
    'Account email (Work App / invites): {email}. If login fails after desk email only, use Resend provisioning emails below to send employee portal invites.',
  resendEmails: 'Resend emails',
  sending: 'Sending…',
  welcomeSent: 'Welcome email sent',
  welcomeSkipped: 'Welcome email already sent',
  deskSent: 'Desk credentials email sent',
  deskSkipped: 'Desk email already sent',
  employeeInvitesSent: '{count} employee invite email(s) sent',
  employeeInvitesSkipped: 'Employee invites already sent',
  someEmailsFailed: 'Some emails could not be sent',
  noEmailsSent: 'No emails were sent',
  employeeInvitesStatus: '{sent} sent, {pending} pending',
}

export const ONBOARDING_PAYMENT_SUCCESS_KEYS = {
  title: 'Payment Successful!',
  loadingReceipt: 'Loading receipt…',
  linkingWorkspace: 'Linking your paid workspace to this browser session…',
  workspaceBlocked:
    'We could not register your workspace from this payment session. Refresh this page while signed in, or contact support with your transaction id.',
  amountLabel: 'Amount',
  transactionIdLabel: 'Transaction ID',
  paymentMethodLabel: 'Payment method',
  paymentMethodDefault: 'Card',
  dateLabel: 'Date',
  planLabel: 'Plan',
  confirmationEmail:
    'A confirmation and invoice will be sent to {email} from Vouus. You may also receive a receipt from Stripe.',
  emailMissingHint:
    'Enter your email on Stripe Checkout to receive Vouus billing email, or use Download receipt when available. Stripe may also send its own receipt.',
  submitNext: 'Next',
  submitLoading: 'Loading…',
  submitLinking: 'Linking workspace…',
  downloadReceipt: 'Download receipt',
  receiptEmailHint: 'Receipt link will appear in your confirmation email if not shown here.',
  needHelp: 'Need help? Contact our support team at',
}

export const XERO_MIGRATION_KEYS = {
  title: 'Xero migration job',
  subtitleLoading: 'Loading job status…',
  jobIdPrefix: 'Job',
  statusLabel: 'Status',
  modeLabel: 'Mode',
  targetErpLabel: 'Target ERP',
  entitiesExtractedTitle: 'Entities extracted',
  validationLabel: 'Validation — L1 errors: {l1}, L2 warnings: {l2}',
  attachmentLoadLabel:
    'Attachment upload — uploaded: {uploaded}, skipped: {skipped}, errors: {errors}',
  reconcilePassed: 'L3 trial balance reconcile: passed',
  reconcileNeedsReview: 'L3 trial balance reconcile: needs review',
  reconcileAccountsSuffix: '{count} accounts',
  reconcileOutOfTolerance: '{count} out of tolerance',
  columnAccount: 'Account',
  columnXero: 'Xero',
  columnErp: 'ERP',
  columnDelta: 'Delta',
  columnReasons: 'Reasons',
  agingReconcileTitle: 'AR/AP aging reconcile',
  agingPassed: 'passed',
  agingNeedsReview: 'needs review',
  agingSkipped: 'Skipped ({reason})',
  agingCompare: 'Xero {source} vs ERP {target} (delta {delta})',
  rawSummaryLabel: 'Raw summary JSON',
  jobNotAvailable: 'Job not available.',
  loadFailed: 'Load failed',
}
