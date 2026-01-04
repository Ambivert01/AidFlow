import { useState } from "react";
import { createCampaign } from "../../services/ngo.service";
import { useNavigate } from "react-router-dom";

export default function CreateCampaign() {
  const [form, setForm] = useState({
    title: "",
    location: "",
    disasterType: ""
  });

  const navigate = useNavigate();

  const handleSubmit = () => {
    createCampaign(form)
      .then(() => navigate("/ngo"))
      .catch(() => alert("Campaign creation failed"));
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-4">Create Relief Campaign</h2>

      <input
        placeholder="Campaign Title"
        className="input"
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Location"
        className="input mt-3"
        onChange={e => setForm({ ...form, location: e.target.value })}
      />

      <input
        placeholder="Disaster Type"
        className="input mt-3"
        onChange={e => setForm({ ...form, disasterType: e.target.value })}
      />

      <button onClick={handleSubmit} className="btn-primary mt-4">
        Create Campaign
      </button>
    </div>
  );
}
