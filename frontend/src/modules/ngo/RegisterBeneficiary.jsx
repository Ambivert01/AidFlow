import { useEffect, useState } from "react";
import api from "../../services/api";
import InfoNotice from "../../components/InfoNotice";
import Loader from "../../components/Loader";

export default function RegisterBeneficiary() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    aadhaar: "",
    campaignId: "",
    location: {
      state: "",
      district: "",
      ward: "",
    },
  });

  // Load NGO campaigns
useEffect(() => {
  api.get("/ngo/campaigns")
    .then(res => setCampaigns(res.data?.data || res.data || []))
    .catch(() => setCampaigns([]));
}, []);

const submit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setMsg("");

  try {
    await api.post("/beneficiaries", {
      name: form.name,
      campaignId: form.campaignId,
      phone: form.aadhaar || "0000000000",
      familySize: 1,
      displacementStatus: "UNKNOWN",
      location: {
        state: form.location.state,
        district: form.location.district,
        ward: form.location.ward,
      },
    });

    setMsg("Beneficiary registered and sent for AI evaluation");
  } catch (err) {
    setError(err.response?.data?.message || "Registration failed");
  } finally {
    setLoading(false);
  }
};


  if (loading) return <Loader text="Registering beneficiary..." />;

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-xl font-bold">Register Beneficiary</h2>

      <InfoNotice
        title="Governance Notice"
        message="Beneficiary data is evaluated by AI and permanently audited. Aadhaar is hashed and never stored."
      />

      {msg && <p className="text-green-600">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded shadow">
        <input
          placeholder="Beneficiary Name"
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          placeholder="Aadhaar Number"
          className="border p-2 w-full"
          value={form.aadhaar}
          onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
          required
        />

        <select
          className="border p-2 w-full"
          value={form.campaignId}
          onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
          required
        >
          <option value="">Select Campaign</option>
          {campaigns.map(c => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>

        <input
          placeholder="State"
          className="border p-2 w-full"
          value={form.location.state}
          onChange={(e) =>
            setForm({
              ...form,
              location: { ...form.location, state: e.target.value },
            })
          }
          required
        />

        <input
          placeholder="District"
          className="border p-2 w-full"
          value={form.location.district}
          onChange={(e) =>
            setForm({
              ...form,
              location: { ...form.location, district: e.target.value },
            })
          }
          required
        />

        <input
          placeholder="Ward"
          className="border p-2 w-full"
          value={form.location.ward}
          onChange={(e) =>
            setForm({
              ...form,
              location: { ...form.location, ward: e.target.value },
            })
          }
          required
        />

        <button className="bg-blue-700 text-white px-4 py-2 rounded w-full">
          Register Beneficiary
        </button>
      </form>
    </div>
  );
}
