import { useState } from "react";
import { createCampaign } from "../../services/ngo.service";
import { useNavigate } from "react-router-dom";

export default function CreateCampaign() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    disasterType: "",
    location: "",
    policySnapshot: {
      allowedCategories: ["food", "medicine"],
      maxPerBeneficiary: 5000,
      validityDays: 30,
      cooldownDays: 90,
      minEligibilityConfidence: 0.6,
      maxFraudRisk: 0.7,
    },
  });

  const submit = async () => {
    try {
      await createCampaign(form);
      navigate("/ngo");
    } catch (err) {
      alert("Campaign creation failed");
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-bold">Create Relief Campaign</h2>

      <input
        placeholder="Campaign Title"
        className="input"
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
      />

      <textarea
        placeholder="Description"
        className="input"
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />

      <input
        placeholder="Location"
        className="input"
        onChange={(e) =>
          setForm({ ...form, location: e.target.value })
        }
      />

      <select
        className="input"
        onChange={(e) =>
          setForm({ ...form, disasterType: e.target.value })
        }
      >
        <option value="">Select Disaster</option>
        <option value="FLOOD">Flood</option>
        <option value="EARTHQUAKE">Earthquake</option>
        <option value="CYCLONE">Cyclone</option>
        <option value="FIRE">Fire</option>
      </select>

      <button
        onClick={submit}
        className="bg-blue-700 text-white px-4 py-2 rounded"
      >
        Create Campaign
      </button>
    </div>
  );
}
