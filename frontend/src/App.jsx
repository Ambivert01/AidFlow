import { BrowserRouter, Routes, Route } from "react-router-dom";

import DonorDashboard from "./modules/donor/DonorDashboard";
import NGODashboard from "./modules/ngo/NGODashboard";
import BeneficiaryDashboard from "./modules/beneficiary/BeneficiaryDashboard";
import ScanQR from "./modules/beneficiary/ScanQR";
import PaymentHistory from "./modules/beneficiary/PaymentHistory";

import MerchantDashboard from "./modules/merchant/MerchantDashboard";
import GenerateQR from "./modules/merchant/GenerateQR";
import ConfirmPayment from "./modules/merchant/ConfirmPayment";
import MerchantTransactions from "./modules/merchant/MerchantTransactions";


import GovtDashboard from "./modules/government/GovtDashboard";
import PublicAudit from "./modules/public/PublicAudit";

import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login.jsx";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./utils/constants";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={
            <div className="h-screen flex items-center justify-center text-2xl">
              AidFlow Platform 🚀
            </div>
          }
        />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />

        {/* DONOR */}
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

        {/* NGO */}
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

        {/* BENEFICIARY */}
        <Route
          path="/beneficiary"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BENEFICIARY]}>
              <Layout>
                <BeneficiaryDashboard />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route
            path="scan"
            element={
              <ProtectedRoute allowedRoles={[ROLES.BENEFICIARY]}>
                <Layout>
                  <ScanQR />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="history"
            element={
              <ProtectedRoute allowedRoles={[ROLES.BENEFICIARY]}>
                <Layout>
                  <PaymentHistory />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/merchant"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MERCHANT]}>
              <Layout>
                <MerchantDashboard />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route
            path="qr"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MERCHANT]}>
                <Layout>
                  <GenerateQR />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="confirm"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MERCHANT]}>
                <Layout>
                  <ConfirmPayment />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="history"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MERCHANT]}>
                <Layout>
                  <MerchantTransactions />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* GOVERNMENT */}
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

        {/* PUBLIC AUDIT */}
        <Route
          path="/public"
          element={
            <Layout>
              <PublicAudit />
            </Layout>
          }
        />

        {/* UNAUTHORIZED */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
