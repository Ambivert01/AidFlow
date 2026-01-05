import { useNavigate } from "react-router-dom";
import { ROLES } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";

export default function RoleSelect() {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const roles = [
    { key: ROLES.DONOR, label: "Donor" },
    { key: ROLES.NGO, label: "NGO" },
    { key: ROLES.GOVERNMENT, label: "Government" },
    { key: ROLES.MERCHANT, label: "Merchant" },
    { key: ROLES.BENEFICIARY, label: "Beneficiary" },
  ];

  const handleSelect = (role) => {
    setRole(role);
    navigate(`/${role.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Select Your Role</h1>

      <div className="grid grid-cols-2 gap-4">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => handleSelect(r.key)}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
