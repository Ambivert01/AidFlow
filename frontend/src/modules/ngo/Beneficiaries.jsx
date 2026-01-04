import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [form, setForm] = useState({
    name: "",
    aadhaar: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);

  // 1️⃣ Fetch beneficiaries
  useEffect(() => {
    api.get("/ngo/beneficiaries").then(res => {
      setBeneficiaries(res.data);
    });
  }, []);

  // 2️⃣ Handle input
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 3️⃣ Submit beneficiary
  const addBeneficiary = async () => {
    setLoading(true);
    try {
      await api.post("/ngo/beneficiaries", form);
      const refreshed = await api.get("/ngo/beneficiaries");
      setBeneficiaries(refreshed.data);
      setForm({ name: "", aadhaar: "", location: "" });
    } catch {
      alert("Beneficiary flagged or duplicate detected");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Beneficiaries</h2>

      {/* 🔹 Add Beneficiary */}
      <div className="border p-4 rounded bg-gray-50">
        <h3 className="font-semibold mb-2">Add Beneficiary</h3>

        <input
          name="name"
          placeholder="Full Name"
          className="border p-2 w-full mb-2"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="aadhaar"
          placeholder="Aadhaar Number"
          className="border p-2 w-full mb-2"
          value={form.aadhaar}
          onChange={handleChange}
        />

        <input
          name="location"
          placeholder="Location / Ward"
          className="border p-2 w-full mb-2"
          value={form.location}
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={addBeneficiary}
        >
          {loading ? "Verifying..." : "Add Beneficiary"}
        </button>
      </div>

      {/* 🔹 Beneficiary List */}
      <div>
        <h3 className="font-semibold mb-2">Registered Beneficiaries</h3>

        {beneficiaries.map(b => (
          <div
            key={b._id}
            className="border p-3 rounded mb-2 flex justify-between"
          >
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-sm">Location: {b.location}</p>
              <p className="text-sm">Status: {b.status}</p>
            </div>

            <div className="text-right">
              <p className="text-sm">
                Risk Score:{" "}
                <span
                  className={
                    b.riskScore > 60 ? "text-red-600" : "text-green-600"
                  }
                >
                  {b.riskScore}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Aadhaar Hash Stored
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
