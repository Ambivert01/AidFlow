import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequestAccess from "./pages/RequestAccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Sessions from "./pages/Sessions";
import PublicAidAuditPage from "./pages/PublicAidAuditPage";
import PublicCampaigns from "./modules/public/PublicCampaigns";
import TrustRankingPage from "./pages/TrustRankingPage";

// Role Modules
import DonorDashboard from "./modules/donor/DonorDashboard";
import Donate from "./modules/donor/Donate";
import DonationTimeline from "./modules/donor/DonationTimeline";

import NGODashboard from "./modules/ngo/NGODashboard";
import CreateCampaign from "./modules/ngo/CreateCampaign";
import ManageCampaign from "./modules/ngo/ManageCampaign";
import NGOReviewDashboard from "./modules/ngo/NGOReviewDashboard";
import Beneficiaries from "./modules/ngo/Beneficiaries";
import RegisterBeneficiary from "./modules/ngo/RegisterBeneficiary";

import BeneficiaryDashboard from "./modules/beneficiary/BeneficiaryDashboard";
import BeneficiaryQR from "./modules/beneficiary/BeneficiaryQR";

import MerchantDashboard from "./modules/merchant/MerchantDashboard";
import MerchantScan from "./modules/merchant/MerchantScan";
import ConfirmPayment from "./modules/merchant/ConfirmPayment";
import MerchantTransactions from "./modules/merchant/MerchantTransactions";

import GovtDashboard from "./modules/government/GovtDashboard";
import EscalatedDonations from "./modules/government/EscalatedDonations";
import FraudMonitor from "./modules/government/FraudMonitor";
import GovtWallets from "./modules/government/GovtWallets";
import GovtCampaigns from "./modules/government/GovtCampaigns";

import AdminDashboard from "./modules/admin/AdminDashboard";
import PendingRequests from "./modules/admin/PendingRequests";
import PendingCampaigns from "./modules/admin/PendingCampaigns";
import AdminUsers from "./modules/admin/AdminUsers";
import AdminMerchants from "./modules/admin/AdminMerchants";
import AdminAuditLogs from "./modules/admin/AdminAuditLogs";

import BeneficiarySelfApply from "./modules/beneficiary/BeneficiarySelfApply";

// Role-based route guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If logged in but wrong role, send them to their actual home
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  return children;
};

// Route logged-in users away from auth pages
const AuthRoute = ({ children }) => {
  const { user, token } = useAuthStore();
  if (token && user)
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <AuthRoute>
                <HomePage />
              </AuthRoute>
            }
          />
          <Route
            path="/login"
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoute>
                <Register />
              </AuthRoute>
            }
          />
          <Route
            path="/request-access"
            element={
              <AuthRoute>
                <RequestAccess />
              </AuthRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthRoute>
                <ForgotPassword />
              </AuthRoute>
            }
          />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/public-audit" element={<PublicAidAuditPage />} />
          <Route path="/public/campaigns" element={<PublicCampaigns />} />
          <Route path="/trust-rankings" element={<TrustRankingPage />} />

          {/* Protected: Session Management */}
          <Route
            path="/settings/sessions"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />

          {/* Donor Routes */}
          <Route
            path="/donor"
            element={
              <ProtectedRoute allowedRoles={["DONOR"]}>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/campaigns/:id/donate"
            element={
              <ProtectedRoute allowedRoles={["DONOR"]}>
                <Donate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/donation/:id"
            element={
              <ProtectedRoute allowedRoles={["DONOR"]}>
                <DonationTimeline />
              </ProtectedRoute>
            }
          />

          {/* NGO Routes */}
          <Route
            path="/ngo"
            element={
              <ProtectedRoute allowedRoles={["NGO"]}>
                <NGODashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ngo/campaigns/create"
            element={
              <ProtectedRoute allowedRoles={["NGO"]}>
                <CreateCampaign />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ngo/campaigns/:id"
            element={
              <ProtectedRoute allowedRoles={["NGO"]}>
                <ManageCampaign />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ngo/reviews"
            element={
              <ProtectedRoute allowedRoles={["NGO"]}>
                <NGOReviewDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ngo/beneficiaries"
            element={
              <ProtectedRoute allowedRoles={["NGO"]}>
                <Beneficiaries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ngo/beneficiaries/register"
            element={
              <ProtectedRoute allowedRoles={["NGO"]}>
                <RegisterBeneficiary />
              </ProtectedRoute>
            }
          />

          {/* Beneficiary Routes */}
          <Route
            path="/beneficiary"
            element={
              <ProtectedRoute allowedRoles={["BENEFICIARY"]}>
                <BeneficiaryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/beneficiary/qr"
            element={
              <ProtectedRoute allowedRoles={["BENEFICIARY"]}>
                <BeneficiaryQR />
              </ProtectedRoute>
            }
          />
          <Route
            path="/beneficiary/apply"
            element={
              <ProtectedRoute allowedRoles={["BENEFICIARY"]}>
                <BeneficiarySelfApply />
              </ProtectedRoute>
            }
          />

          {/* Merchant Routes */}
          <Route
            path="/merchant"
            element={
              <ProtectedRoute allowedRoles={["MERCHANT"]}>
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/scan"
            element={
              <ProtectedRoute allowedRoles={["MERCHANT"]}>
                <MerchantScan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/confirm"
            element={
              <ProtectedRoute allowedRoles={["MERCHANT"]}>
                <ConfirmPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/transactions"
            element={
              <ProtectedRoute allowedRoles={["MERCHANT"]}>
                <MerchantTransactions />
              </ProtectedRoute>
            }
          />

          {/* Government Routes */}
          <Route
            path="/government"
            element={
              <ProtectedRoute allowedRoles={["GOVERNMENT"]}>
                <GovtDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government/escalated"
            element={
              <ProtectedRoute allowedRoles={["GOVERNMENT"]}>
                <EscalatedDonations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government/fraud"
            element={
              <ProtectedRoute allowedRoles={["GOVERNMENT"]}>
                <FraudMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government/wallets"
            element={
              <ProtectedRoute allowedRoles={["GOVERNMENT"]}>
                <GovtWallets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government/campaigns"
            element={
              <ProtectedRoute allowedRoles={["GOVERNMENT"]}>
                <GovtCampaigns />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <PendingRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/campaigns/pending"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <PendingCampaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/merchants"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminMerchants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
