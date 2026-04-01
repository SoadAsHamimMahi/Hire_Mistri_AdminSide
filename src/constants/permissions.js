// Permission constants for admin modules. Use '*' for full access.
export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  PROVIDERS: 'providers',
  PROVIDER_PAYMENTS: 'provider_payments',
  SETTLEMENTS: 'settlements',
  CASH_COLLECTION: 'cash_collection',
  LEDGERS: 'ledgers',
  DUE_PAYMENTS: 'due_payments',
  BOOKINGS: 'bookings',
  BOOKING_PAYMENTS: 'booking_payments',
  CUSTOM_JOBS: 'custom_jobs',
  SERVICES: 'services',
  CATEGORIES: 'categories',
  HOME_SLIDERS: 'home_sliders',
  HOME_FEATURED: 'home_featured',
  CUSTOMERS: 'customers',
  CUSTOMER_TRANSACTIONS: 'customer_transactions',
  CUSTOMER_ADDRESSES: 'customer_addresses',
  SUPPORT_QUERIES: 'support_queries',
  SUPPORT_CHAT: 'support_chat',
  REPORTING_REASONS: 'reporting_reasons',
  BLOCKED_USERS: 'blocked_users',
  PROMO_CODES: 'promo_codes',
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  SUBSCRIPTION: 'subscription',
  MEDIA_GALLERY: 'media_gallery',
  SYSTEM_FAQS: 'system_faqs',
  SYSTEM_USERS: 'system_users',
  SYSTEM_BACKUP: 'system_backup',
}

// Map route path (as used in router) to required permission. '*' means any admin.
export const routeToPermission = {
  '/dashboard': PERMISSIONS.DASHBOARD,
  '/providers': PERMISSIONS.PROVIDERS,
  '/providers/payment-request': PERMISSIONS.PROVIDER_PAYMENTS,
  '/providers/settlements': PERMISSIONS.SETTLEMENTS,
  '/providers/cash-collection': PERMISSIONS.CASH_COLLECTION,
  '/providers/ledgers': PERMISSIONS.LEDGERS,
  '/providers/due-payments': PERMISSIONS.DUE_PAYMENTS,
  '/bookings': PERMISSIONS.BOOKINGS,
  '/bookings/payments': PERMISSIONS.BOOKING_PAYMENTS,
  '/bookings/custom-requests': PERMISSIONS.CUSTOM_JOBS,
  '/services': PERMISSIONS.SERVICES,
  '/services/add': PERMISSIONS.SERVICES,
  '/services/bulk': PERMISSIONS.SERVICES,
  '/services/categories': PERMISSIONS.CATEGORIES,
  '/home-screen/sliders': PERMISSIONS.HOME_SLIDERS,
  '/home-screen/featured': PERMISSIONS.HOME_FEATURED,
  '/customers': PERMISSIONS.CUSTOMERS,
  '/customers/transactions': PERMISSIONS.CUSTOMER_TRANSACTIONS,
  '/customers/addresses': PERMISSIONS.CUSTOMER_ADDRESSES,
  '/support/queries': PERMISSIONS.SUPPORT_QUERIES,
  '/support/chat': PERMISSIONS.SUPPORT_CHAT,
  '/support/reporting-reasons': PERMISSIONS.REPORTING_REASONS,
  '/support/blocked-users': PERMISSIONS.BLOCKED_USERS,
  '/promo/codes': PERMISSIONS.PROMO_CODES,
  '/promo/notifications': PERMISSIONS.NOTIFICATIONS,
  '/promo/email': PERMISSIONS.EMAIL,
  '/subscription': PERMISSIONS.SUBSCRIPTION,
  '/media/gallery': PERMISSIONS.MEDIA_GALLERY,
  '/system/faqs': PERMISSIONS.SYSTEM_FAQS,
  '/system/users': PERMISSIONS.SYSTEM_USERS,
  '/system/backup': PERMISSIONS.SYSTEM_BACKUP,
}

export function hasPermission(adminPermissions, pathname) {
  if (!Array.isArray(adminPermissions)) return false
  if (adminPermissions.includes('*')) return true
  const required = routeToPermission[pathname]
  return required ? adminPermissions.includes(required) : true
}
