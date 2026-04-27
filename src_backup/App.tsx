import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, MerchantRoute, MerchantPublicRoute, CustomerRoute, CustomerPublicRoute } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

// Layouts
import MerchantLayout from './components/merchant/MerchantLayout'
import CustomerLayout from './components/customer/CustomerLayout'

// Merchant pages
import MerchantRegister from './pages/merchant/Register'
import MerchantLogin from './pages/merchant/Login'
import MerchantOnboarding from './pages/merchant/Onboarding'
import MerchantDashboard from './pages/merchant/Dashboard'
import MerchantCustomers from './pages/merchant/Customers'
import MerchantCustomerDetail from './pages/merchant/CustomerDetail'
import MerchantAnalytics from './pages/merchant/Analytics'
import MerchantNotifications from './pages/merchant/Notifications'
import MerchantBilling from './pages/merchant/Billing'
import MerchantSettings from './pages/merchant/MerchantSettings'

// Customer pages
import Scan from './pages/customer/Scan'
import Auth from './pages/customer/Auth'
import Card from './pages/customer/Card'
import History from './pages/customer/History'
import Settings from './pages/customer/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ─── ROOT ─── */}
            {/* By default redirect to scan mapping or merchant login if desktop. We rely on the /scan entrypoint */}
            <Route path="/" element={<Navigate to="/scan" replace />} />

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
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/scan" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
