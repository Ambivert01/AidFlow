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

      // VERY IMPORTANT: update React auth state
      setUser(user);

      // Role-based redirect
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
        err?.response?.data?.message || "Login failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          AidFlow Login
        </h2>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
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
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
