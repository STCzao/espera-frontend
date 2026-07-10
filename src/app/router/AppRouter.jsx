import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoadingScreen } from '../../shared/ui/LoadingScreen.jsx'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { BusinessPanelLayout } from '../layouts/BusinessPanelLayout.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage.jsx').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage.jsx').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../../features/auth/pages/ForgotPasswordPage.jsx').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('../../features/auth/pages/ResetPasswordPage.jsx').then((module) => ({ default: module.ResetPasswordPage })))
const VerifyEmailPage = lazy(() => import('../../features/auth/pages/VerifyEmailPage.jsx').then((module) => ({ default: module.VerifyEmailPage })))
const GoogleCallbackPage = lazy(() => import('../../features/auth/pages/GoogleCallbackPage.jsx').then((module) => ({ default: module.GoogleCallbackPage })))
const BusinessCreatePage = lazy(() => import('../../features/business-onboarding/pages/BusinessCreatePage.jsx').then((module) => ({ default: module.BusinessCreatePage })))
const NoBusinessPanel = lazy(() => import('../../features/business-onboarding/pages/NoBusinessPanel.jsx').then((module) => ({ default: module.NoBusinessPanel })))
const BusinessHomePage = lazy(() => import('../../features/business-home/pages/BusinessHomePage.jsx').then((module) => ({ default: module.BusinessHomePage })))
const BusinessProfilePage = lazy(() => import('../../features/business-profile/pages/BusinessProfilePage.jsx').then((module) => ({ default: module.BusinessProfilePage })))
const BusinessHoursPage = lazy(() => import('../../features/business-hours/pages/BusinessHoursPage.jsx').then((module) => ({ default: module.BusinessHoursPage })))
const BusinessOperationsPage = lazy(() => import('../../features/business-operations/pages/BusinessOperationsPage.jsx').then((module) => ({ default: module.BusinessOperationsPage })))
const BusinessQrPage = lazy(() => import('../../features/business-qr/pages/BusinessQrPage.jsx').then((module) => ({ default: module.BusinessQrPage })))
const ResolveQrPage = lazy(() => import('../../features/business-qr/pages/ResolveQrPage.jsx').then((module) => ({ default: module.ResolveQrPage })))
const BusinessEmployeesPage = lazy(() => import('../../features/business-employees/pages/BusinessEmployeesPage.jsx').then((module) => ({ default: module.BusinessEmployeesPage })))
const AcceptEmployeeInvitationPage = lazy(() => import('../../features/business-employees/pages/AcceptEmployeeInvitationPage.jsx').then((module) => ({ default: module.AcceptEmployeeInvitationPage })))

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/oauth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/business/employee-invitations/:token" element={<AcceptEmployeeInvitationPage />} />
          <Route path="/q/:token" element={<ResolveQrPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/business/new" element={<BusinessCreatePage />} />
          <Route path="/panel" element={<BusinessPanelLayout />}>
            <Route index element={<NoBusinessPanel />} />
          </Route>
          <Route path="/panel/business/:businessSlug" element={<BusinessPanelLayout />}>
            <Route index element={<BusinessHomePage />} />
            <Route path="profile" element={<BusinessProfilePage />} />
            <Route path="hours" element={<BusinessHoursPage />} />
            <Route path="operations" element={<BusinessOperationsPage />} />
            <Route path="qr" element={<BusinessQrPage />} />
            <Route path="employees" element={<BusinessEmployeesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
