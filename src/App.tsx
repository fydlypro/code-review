import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, MerchantRoute, MerchantPublicRoute, CustomerRoute, CustomerPublicRoute, AdminRoute } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

// Layouts
import MerchantLayout from './components/merchant/MerchantLayout'
import CustomerLayout from './components/customer/CustomerLayout'
import AdminLayout from './components/admin/AdminLayout'

// Admin pages
import AdminLogin from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboardPage'
import AdminMerchants from './pages/admin/AdminMerchantsPage'
import AdminMerchantDetail from './pages/admin/AdminMerchantDetailPage'

// Merchant pages
import MerchantRegister from './pages/merchant/RegisterPage'
import MerchantLogin from './pages/merchant/LoginPage'
import MerchantOnboarding from './pages/merchant/OnboardingPage'
import MerchantDashboard from './pages/merchant/DashboardPage'
import MerchantCustomers from './pages/merchant/CustomersPage'
import MerchantCustomerDetail from './pages/merchant/CustomerDetailPage'
import MerchantAnalytics from './pages/merchant/AnalyticsPage'
import MerchantNotifications from './pages/merchant/NotificationsPage'
import MerchantBilling from './pages/merchant/BillingPage'
import MerchantSettings from './pages/merchant/MerchantSettingsPage'
import MerchantSupport from './pages/merchant/SupportPage'

// Customer pages
import LandingPage from './pages/LandingPage'
import RewardPreview from './pages/customer/RewardPreview'
import Scan from './pages/customer/ScanPage'
import Auth from './pages/customer/AuthPage'
import Card from './pages/customer/CardPage'
import History from './pages/customer/HistoryPage'
import Settings from './pages/customer/SettingsPage'
import Support from './pages/customer/SupportPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ─── ROOT ─── */}
            <Route path="/" element={<LandingPage />} />

            {/* ─── SCAN (PUBLIC ENTRY EVENT) ─── */}
            <Route path="/scan" element={<Scan />} />

            {/* ─── CUSTOMER ROUTES ─── */}
            <Route
              path="/customer/auth"
              element={
                <CustomerPublicRoute>
                  <Auth />
                </CustomerPublicRoute>
              }
            />

            <Route
              path="/customer"
              element={
                <CustomerRoute>
                  <CustomerLayout />
                </CustomerRoute>
              }
            >
              <Route index element={<Navigate to="/customer/card" replace />} />
              <Route path="card" element={<Card />} />
              <Route path="history" element={<History />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
              {/* Note: reward is part of card state / dynamic component or separate view. We route to card for now, it handles ?reward=true or similar if needed */}
            </Route>

            {/* ─── MERCHANT PUBLIC ROUTES ─── */}
            <Route
              path="/merchant/register"
              element={
                <MerchantPublicRoute>
                  <MerchantRegister />
                </MerchantPublicRoute>
              }
            />
            <Route
              path="/merchant/login"
              element={
                <MerchantPublicRoute>
                  <MerchantLogin />
                </MerchantPublicRoute>
              }
            />

            {/* Onboarding — session required, no merchant profile yet */}
            <Route path="/merchant/onboarding" element={<MerchantOnboarding />} />

            {/* ─── MERCHANT PROTECTED ROUTES ─── */}
            <Route
              path="/merchant"
              element={
                <MerchantRoute>
                  <MerchantLayout />
                </MerchantRoute>
              }
            >
              <Route index element={<Navigate to="/merchant/dashboard" replace />} />
              <Route path="dashboard"     element={<MerchantDashboard />} />
              <Route path="customers"     element={<MerchantCustomers />} />
              <Route path="customers/:id" element={<MerchantCustomerDetail />} />
              <Route path="analytics"     element={<MerchantAnalytics />} />
              <Route path="notifications" element={<MerchantNotifications />} />
              <Route path="billing"       element={<MerchantBilling />} />
              <Route path="settings"      element={<MerchantSettings />} />
              <Route path="support"       element={<MerchantSupport />} />
            </Route>

            {/* Previews temporaires */}
            <Route path="/preview/reward" element={<RewardPreview />} />
            <Route path="/preview/support" element={<Support />} />
            <Route path="/preview/merchant-support" element={<MerchantSupport />} />

            {/* ─── ADMIN ROUTES ─── */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard"         element={<AdminDashboard />} />
              <Route path="merchants"         element={<AdminMerchants />} />
              <Route path="merchants/:id"     element={<AdminMerchantDetail />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/scan" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
