import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AdminGuard from './components/AdminGuard'
import AdminLayout from './layout/AdminLayout'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import Dashboard from './pages/Dashboard'
import Providers from './pages/providers/Providers'
import WorkerDetail from './pages/providers/WorkerDetail'
import WorkerRegistrations from './pages/providers/WorkerRegistrations'
import PaymentRequest from './pages/providers/PaymentRequest'
import Settlements from './pages/providers/Settlements'
import CashCollection from './pages/providers/CashCollection'
import Bookings from './pages/bookings/Bookings'
import BookingPayments from './pages/bookings/BookingPayments'
import CustomJobRequests from './pages/bookings/CustomJobRequests'
import ServiceList from './pages/services/ServiceList'
import ServiceAdd from './pages/services/ServiceAdd'
import ServiceBulk from './pages/services/ServiceBulk'
import Categories from './pages/services/Categories'
import Sliders from './pages/homeScreen/Sliders'
import FeaturedSection from './pages/homeScreen/FeaturedSection'
import Customers from './pages/customers/Customers'
import CustomerDetail from './pages/customers/CustomerDetail'
import Transactions from './pages/customers/Transactions'
import Addresses from './pages/customers/Addresses'
import UserQueries from './pages/support/UserQueries'
import Chat from './pages/support/Chat'
import ReportingReasons from './pages/support/ReportingReasons'
import BlockedUsers from './pages/support/BlockedUsers'
import PromoCodes from './pages/promo/PromoCodes'
import Notifications from './pages/promo/Notifications'
import Email from './pages/promo/Email'
import Subscription from './pages/Subscription'
import Gallery from './pages/media/Gallery'
import Faqs from './pages/system/Faqs'
import SystemUsers from './pages/system/SystemUsers'
import DatabaseBackup from './pages/system/DatabaseBackup'
import AdminAudit from './pages/system/AdminAudit'
import './index.css'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/',
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'providers', element: <Providers /> },
      { path: 'providers/:uid', element: <WorkerDetail /> },
      { path: 'providers/registrations', element: <WorkerRegistrations /> },
      { path: 'providers/payment-request', element: <PaymentRequest /> },
      { path: 'providers/settlements', element: <Settlements /> },
      { path: 'providers/cash-collection', element: <CashCollection /> },
      { path: 'bookings', element: <Bookings /> },
      { path: 'bookings/payments', element: <BookingPayments /> },
      { path: 'bookings/custom-requests', element: <CustomJobRequests /> },
      { path: 'services', element: <ServiceList /> },
      { path: 'services/add', element: <ServiceAdd /> },
      { path: 'services/bulk', element: <ServiceBulk /> },
      { path: 'services/categories', element: <Categories /> },
      { path: 'home-screen/sliders', element: <Sliders /> },
      { path: 'home-screen/featured', element: <FeaturedSection /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/:uid', element: <CustomerDetail /> },
      { path: 'customers/transactions', element: <Transactions /> },
      { path: 'customers/addresses', element: <Addresses /> },
      { path: 'support/queries', element: <UserQueries /> },
      { path: 'support/chat', element: <Chat /> },
      { path: 'support/reporting-reasons', element: <ReportingReasons /> },
      { path: 'support/blocked-users', element: <BlockedUsers /> },
      { path: 'promo/codes', element: <PromoCodes /> },
      { path: 'promo/notifications', element: <Notifications /> },
      { path: 'promo/email', element: <Email /> },
      { path: 'subscription', element: <Subscription /> },
      { path: 'media/gallery', element: <Gallery /> },
      { path: 'system/faqs', element: <Faqs /> },
      { path: 'system/users', element: <SystemUsers /> },
      { path: 'system/backup', element: <DatabaseBackup /> },
      { path: 'system/audit', element: <AdminAudit /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)
