import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./utils/constants";

/* Pages */
// ADD import
import AdminDashboard from "./modules/admin/AdminDashboard";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import RequestAccess from "./pages/RequestAccess";
import PublicLanding from "./modules/public/PublicLanding";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

/* Public */
import PublicAudit from "./modules/public/PublicAudit";

/* Dashboards */
import DonorDashboard from "./modules/donor/DonorDashboard";
import NGODashboard from "./modules/ngo/NGODashboard";
import NGOReviewDashboard from "./modules/ngo/NGOReviewDashboard";
import BeneficiaryDashboard from "./modules/beneficiary/BeneficiaryDashboard";
import MerchantDashboard from "./modules/merchant/MerchantDashboard";
import GovtDashboard from "./modules/government/GovtDashboard";
import PublicCampaigns from "./modules/public/PublicCampaigns";
import DonationTimeline from "./modules/donor/DonationTimeline";
import MerchantScan from "./modules/merchant/MerchantScan";
import MerchantTransactions from "./modules/merchant/MerchantTransactions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------------- PUBLIC ROUTES ---------------- */}
        <Route
          path="/"
          element={
            <Layout>
              <div className="text-center py-20">
                <Landing />
                <p className="mt-3 text-slate-600">
                  Transparent Disaster Relief Infrastructure
                </p>
              </div>
            </Layout>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/register" element={<Register />} />

        <Route path="/request-access" element={<RequestAccess />} />

        <Route
          path="/public/how-it-works"
          element={
            <Layout>
              <PublicLanding />
            </Layout>
          }
        />

        <Route
          path="/public/audit"
          element={
            <Layout>
              <PublicAudit />
            </Layout>
          }
        />

        <Route
          path="/public/campaigns"
          element={
            <Layout>
              <PublicCampaigns />
            </Layout>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ---------------- DONOR ---------------- */}
        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DONOR]}>
              <Layout>
                <DonorDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/donor/timeline/:jobIdHash"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DONOR]}>
              <Layout>
                <DonationTimeline />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ---------------- NGO ---------------- */}
        <Route
          path="/ngo"
          element={
            <ProtectedRoute allowedRoles={[ROLES.NGO]}>
              <Layout>
                <NGODashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ngo/reviews"
          element={
            <ProtectedRoute allowedRoles={[ROLES.NGO]}>
              <Layout>
                <NGOReviewDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ---------------- BENEFICIARY ---------------- */}
        <Route
          path="/beneficiary"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BENEFICIARY]}>
              <Layout>
                <BeneficiaryDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ---------------- MERCHANT ---------------- */}
        <Route
          path="/merchant"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MERCHANT]}>
              <Layout>
                <MerchantDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/merchant/scan"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MERCHANT]}>
              <Layout>
                <MerchantScan />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/merchant/transactions"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MERCHANT]}>
              <Layout>
                <MerchantTransactions />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ---------------- GOVERNMENT ---------------- */}
        <Route
          path="/government"
          element={
            <ProtectedRoute allowedRoles={[ROLES.GOVERNMENT]}>
              <Layout>
                <GovtDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ---------------- 404 ---------------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
