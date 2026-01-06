import { useState } from "react";
import api from "../services/api";

export default function RequestAccess() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "NGO",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      await api.post("/access/request", form);
      setMsg("Request submitted. Await approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white p-8 rounded shadow w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">Request Access</h2>

        {msg && <p className="text-green-600 mb-3">{msg}</p>}
        {error && <p className="text-red-600 mb-3">{error}</p>}

        <select
          className="w-full border p-2 mb-3"
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="NGO">NGO</option>
          <option value="MERCHANT">Merchant</option>
        </select>

        <input
          placeholder="Organization / Business Name"
          className="w-full border p-2 mb-3"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        <input
          type="email"
          placeholder="Official Email"
          className="w-full border p-2 mb-3"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-4"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
        />

        <button className="w-full bg-blue-700 text-white py-2 rounded">
          Submit Request
        </button>
      </form>
    </div>
  );
}
