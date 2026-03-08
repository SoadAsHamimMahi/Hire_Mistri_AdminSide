import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon,
  PhotoIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  RectangleGroupIcon,
  PhotoIcon as GalleryIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const menuGroups = [
  {
    label: null,
    items: [{ label: 'Dashboard', path: '/dashboard', icon: HomeIcon }],
  },
  {
    label: 'Provider Management',
    items: [
      { label: 'Providers', path: '/providers', icon: UserGroupIcon },
      { label: 'Payment Request', path: '/providers/payment-request', icon: UserGroupIcon },
      { label: 'Settlements', path: '/providers/settlements', icon: UserGroupIcon },
      { label: 'Cash Collection', path: '/providers/cash-collection', icon: UserGroupIcon },
    ],
  },
  {
    label: 'Booking Management',
    items: [
      { label: 'Bookings', path: '/bookings', icon: ClipboardDocumentListIcon },
      { label: "Booking's Payment", path: '/bookings/payments', icon: ClipboardDocumentListIcon },
      { label: 'Custom Job Requests', path: '/bookings/custom-requests', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    label: 'Service Management',
    items: [
      { label: 'Service', path: '/services', icon: WrenchScrewdriverIcon },
      { label: 'Service Categories', path: '/services/categories', icon: WrenchScrewdriverIcon },
      { label: 'Add Service', path: '/services/add', icon: WrenchScrewdriverIcon },
      { label: 'Bulk Update', path: '/services/bulk', icon: WrenchScrewdriverIcon },
    ],
  },
  {
    label: 'Home Screen Management',
    items: [
      { label: 'Sliders', path: '/home-screen/sliders', icon: Squares2X2Icon },
      { label: 'Featured Section', path: '/home-screen/featured', icon: Squares2X2Icon },
    ],
  },
  {
    label: 'Customer Management',
    items: [
      { label: 'Customers', path: '/customers', icon: UserIcon },
      { label: 'Transactions', path: '/customers/transactions', icon: UserIcon },
      { label: 'Addresses', path: '/customers/addresses', icon: UserIcon },
    ],
  },
  {
    label: 'Support Management',
    items: [
      { label: 'User Queries', path: '/support/queries', icon: ChatBubbleLeftRightIcon },
      { label: 'Chat', path: '/support/chat', icon: ChatBubbleLeftRightIcon },
      { label: 'Reporting Reasons', path: '/support/reporting-reasons', icon: ChatBubbleLeftRightIcon },
      { label: 'Blocked Users', path: '/support/blocked-users', icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    label: 'Promotional Management',
    items: [
      { label: 'Promo Codes', path: '/promo/codes', icon: MegaphoneIcon },
      { label: 'Notifications', path: '/promo/notifications', icon: MegaphoneIcon },
      { label: 'Email', path: '/promo/email', icon: MegaphoneIcon },
    ],
  },
  {
    label: 'Subscription Management',
    items: [{ label: 'Subscription', path: '/subscription', icon: RectangleGroupIcon }],
  },
  {
    label: 'Media Management',
    items: [{ label: 'Gallery', path: '/media/gallery', icon: GalleryIcon }],
  },
  {
    label: 'System Management',
    items: [
      { label: 'FAQs', path: '/system/faqs', icon: Cog6ToothIcon },
      { label: 'System Users', path: '/system/users', icon: Cog6ToothIcon },
      { label: 'Database Backup', path: '/system/backup', icon: Cog6ToothIcon },
    ],
  },
]

function SidebarLink({ to, children, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
          isActive
            ? 'bg-slate-800 text-white border-emerald-400'
            : 'text-slate-200 border-transparent hover:bg-slate-800/70 hover:text-white'
        }`
      }
    >
      {Icon && <Icon className="w-5 h-5 shrink-0 text-slate-300 group-hover:text-white" />}
      {children}
    </NavLink>
  )
}

export default function Sidebar() {
  const location = useLocation()
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-5 border-b border-slate-800 hidden lg:block">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-300 font-bold">HM</span>
          </div>
          <div className="leading-tight">
            <div className="text-slate-100 font-semibold">Hire Mistri</div>
            <div className="text-xs text-slate-400">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {menuGroups.map((group) => (
          <div key={group.label || 'root'} className="mb-4">
            {group.label && (
              <div className="px-4 mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.path}>
                  <SidebarLink to={item.path} icon={item.icon} end={item.path === '/dashboard'}>
                    {item.label}
                  </SidebarLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Version</span>
          <span className="text-slate-300">4.1.0</span>
        </div>
        <div className="mt-2 truncate">Path: {location.pathname}</div>
      </div>
    </aside>
  )
}
