import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout.jsx'
import { BusinessPanelLayout } from '../layouts/BusinessPanelLayout.jsx'
import { PendingReviewLayout } from '../layouts/PendingReviewLayout.jsx'
import { PublicLayout } from '../layouts/PublicLayout.jsx'
import { LoginPage } from '../../features/auth/pages/LoginPage.jsx'
import { RegisterPage } from '../../features/auth/pages/RegisterPage.jsx'
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage.jsx'
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage.jsx'
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx'
import { GoogleCallbackPage } from '../../features/auth/pages/GoogleCallbackPage.jsx'
import { BusinessRegisterPage } from '../../features/business-onboarding/pages/BusinessRegisterPage.jsx'
import { BusinessPendingReviewPage } from '../../features/business-onboarding/pages/BusinessPendingReviewPage.jsx'
import { BusinessProfilePage } from '../../features/business-profile/pages/BusinessProfilePage.jsx'
import { BusinessHoursPage } from '../../features/business-hours/pages/BusinessHoursPage.jsx'
import { BusinessOperationsPage } from '../../features/business-operations/pages/BusinessOperationsPage.jsx'
import { BusinessQrPage } from '../../features/business-qr/pages/BusinessQrPage.jsx'
import { ResolveQrPage } from '../../features/business-qr/pages/ResolveQrPage.jsx'
import { BusinessEmployeesPage } from '../../features/business-employees/pages/BusinessEmployeesPage.jsx'
import { AcceptEmployeeInvitationPage } from '../../features/business-employees/pages/AcceptEmployeeInvitationPage.jsx'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/oauth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/business/register" element={<BusinessRegisterPage />} />
        <Route path="/business/employee-invitations/:token" element={<AcceptEmployeeInvitationPage />} />
        <Route path="/q/:token" element={<ResolveQrPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route element={<PendingReviewLayout />}>
          <Route path="/business/pending-review" element={<BusinessPendingReviewPage />} />
        </Route>

        <Route path="/panel/business/:businessId" element={<BusinessPanelLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<BusinessProfilePage />} />
          <Route path="hours" element={<BusinessHoursPage />} />
          <Route path="operations" element={<BusinessOperationsPage />} />
          <Route path="qr" element={<BusinessQrPage />} />
          <Route path="employees" element={<BusinessEmployeesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
