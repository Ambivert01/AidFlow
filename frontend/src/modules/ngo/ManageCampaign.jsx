import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { addBeneficiary, fetchBeneficiaries } from "../../services/ngo.service";

export default function ManageCampaign() {
  const { id } = useParams();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [name, setName] = useState("");

  const load = () =>
    fetchBeneficiaries(id).then(res => setBeneficiaries(res.data));

  useEffect(() => {
    load();
  }, [id]);

  const handleAdd = () => {
    addBeneficiary({ campaignId: id, name })
      .then(load)
      .catch(() => alert("Failed to add beneficiary"));
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Beneficiaries</h2>

      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Beneficiary Name"
          className="input"
        />
        <button onClick={handleAdd} className="btn-primary">
          Add
        </button>
      </div>

      {beneficiaries.map(b => (
        <div key={b._id} className="bg-white p-3 shadow rounded mb-2">
          {b.name} — {b.status}
        </div>
      ))}
    </div>
  );
}
