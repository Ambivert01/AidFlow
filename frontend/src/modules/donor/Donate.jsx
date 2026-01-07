import { useState } from "react";
import { donateToCampaign } from "../../services/donor.service";

export default function Donate({ campaign, onClose }) {
  const [amount, setAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDonate = async () => {
    try {
      setLoading(true);
      setError("");

      await donateToCampaign({
        campaignId: campaign._id,
        amount,
      });

      alert(
        "Donation received.\nYour contribution is now being processed through AI checks and policy enforcement.\nAn audit proof will be generated shortly."
      );

      onClose();
    } catch (err) {
      setError("Donation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold">Donate to {campaign.title}</h3>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="border px-3 py-2 rounded mt-3 w-full"
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleDonate}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Processing..." : "Donate"}
        </button>

        <button onClick={onClose} className="border px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}
