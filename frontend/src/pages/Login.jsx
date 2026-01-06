import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await authService.login({ email, password });
      setUser(user);

      switch (user.role) {
        case "DONOR":
          navigate("/donor");
          break;
        case "NGO":
          navigate("/ngo");
          break;
        case "BENEFICIARY":
          navigate("/beneficiary");
          break;
        case "MERCHANT":
          navigate("/merchant");
          break;
        case "GOVERNMENT":
          navigate("/government");
          break;
        default:
          navigate("/unauthorized");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Login failed. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md space-y-6">

        {/* CONTEXT */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700">
            AidFlow Secure Login
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Access to AidFlow is restricted to verified participants only.
          </p>
        </div>

        {/* INFO BOX */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded text-sm">
          <p className="font-medium mb-1">Who can log in?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Registered Donors</li>
            <li>Verified NGOs</li>
            <li>Approved Merchants</li>
            <li>Onboarded Beneficiaries</li>
            <li>Government Authorities</li>
          </ul>
          <p className="mt-2 text-xs">
            Roles are assigned during onboarding and cannot be selected manually.
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow space-y-4"
        >
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border px-3 py-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Authenticating…" : "Login"}
          </button>
        </form>

        {/* TESTING NOTE */}
        <p className="text-xs text-center text-gray-500">
          Demo access uses pre-verified test accounts provided by the system.
        </p>
      </div>
    </div>
  );
}
