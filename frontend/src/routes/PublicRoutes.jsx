import { Routes, Route } from "react-router-dom";
import PublicAudit from "../modules/public/PublicAudit";
import VerifyAudit from "../modules/public/VerifyAudit";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/public/audit" element={<PublicAudit />} />
      <Route path="/public/verify/:hash" element={<VerifyAudit />} />
    </Routes>
  );
}
