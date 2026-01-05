import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./utils/constants";

/* Pages */
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
                <h1 className="text-3xl font-bold text-blue-700">
                  AidFlow
                </h1>
                <p className="mt-3 text-slate-600">
                  Transparent Disaster Relief Infrastructure
                </p>
              </div>
            </Layout>
          }
        />

        <Route
          path="/public"
          element={
            <Layout>
              <PublicAudit />
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
