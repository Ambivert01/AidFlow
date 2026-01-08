import { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import InfoNotice from "../../components/InfoNotice";

export default function CreateCampaign() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    disasterType: "",
    location: {
      state: "",
      district: "",
      ward: "",
    },
    policySnapshot: {
      allowedCategories: ["food", "medicine"],
      maxPerBeneficiary: 5000,
      validityDays: 30,
      cooldownDays: 90,
      minEligibilityConfidence: 0.6,
      maxFraudRisk: 0.7,
    },
  });

  const updatePolicy = (key, value) => {
    setForm({
      ...form,
      policySnapshot: {
        ...form.policySnapshot,
        [key]: value,
      },
    });
  };

  const submit = async () => {
    try {
      await api.post("/campaigns", form);
      alert("Campaign created as DRAFT");
      navigate("/ngo");
    } catch (err) {
      alert(err.response?.data?.message || "Campaign creation failed");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold">Create Relief Campaign</h2>

      <InfoNotice
        title="Policy Governance"
        message="Once a campaign is activated, all policy rules become immutable and permanently audited."
      />

      {/* BASIC INFO */}
      <input
        className="input"
        placeholder="Campaign Title"
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        className="input"
        placeholder="Description"
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      <select
        className="input"
        onChange={(e) =>
          setForm({ ...form, disasterType: e.target.value })
        }
      >
        <option value="">Select Disaster Type</option>
        <option value="FLOOD">Flood</option>
        <option value="EARTHQUAKE">Earthquake</option>
        <option value="CYCLONE">Cyclone</option>
        <option value="FIRE">Fire</option>
      </select>

      {/* LOCATION */}
      <div className="grid grid-cols-3 gap-3">
        <input
          className="input"
          placeholder="State"
          onChange={(e) =>
            setForm({
              ...form,
              location: { ...form.location, state: e.target.value },
            })
          }
        />
        <input
          className="input"
          placeholder="District"
          onChange={(e) =>
            setForm({
              ...form,
              location: { ...form.location, district: e.target.value },
            })
          }
        />
        <input
          className="input"
          placeholder="Ward"
          onChange={(e) =>
            setForm({
              ...form,
              location: { ...form.location, ward: e.target.value },
            })
          }
        />
      </div>

      {/* POLICY */}
      <h3 className="font-semibold mt-4">Policy Rules (Immutable)</h3>

      <input
        type="number"
        className="input"
        placeholder="Max Amount Per Beneficiary"
        onChange={(e) =>
          updatePolicy("maxPerBeneficiary", Number(e.target.value))
        }
      />

      <input
        type="number"
        className="input"
        placeholder="Wallet Validity (days)"
        onChange={(e) =>
          updatePolicy("validityDays", Number(e.target.value))
        }
      />

      <input
        type="number"
        className="input"
        placeholder="Cooldown Days"
        onChange={(e) =>
          updatePolicy("cooldownDays", Number(e.target.value))
        }
      />

      <input
        type="number"
        step="0.1"
        className="input"
        placeholder="Min Eligibility Confidence (0–1)"
        onChange={(e) =>
          updatePolicy("minEligibilityConfidence", Number(e.target.value))
        }
      />

      <input
        type="number"
        step="0.1"
        className="input"
        placeholder="Max Fraud Risk (0–1)"
        onChange={(e) =>
          updatePolicy("maxFraudRisk", Number(e.target.value))
        }
      />

      <button
        onClick={submit}
        className="bg-blue-700 text-white px-4 py-2 rounded"
      >
        Create Campaign (DRAFT)
      </button>
    </div>
  );
}
