import { useEffect, useState } from "react";
import { fetchDonationHistory } from "../../services/donor.service";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonationHistory()
      .then(res => setDonations(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading donation history..." />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Donations</h2>

      {donations.length === 0 && (
        <p className="text-gray-400">No donations yet</p>
      )}

      {donations.map(d => (
        <div key={d._id} className="bg-white p-4 shadow rounded mb-3">
          <p>{d.campaignTitle}</p>
          <p>₹{d.amount}</p>

          <StatusBadge status={d.status.toUpperCase()} />

          <Link
            to={`/donor/track/${d._id}`}
            className="text-blue-600 underline block mt-2"
          >
            Track Impact
          </Link>
        </div>
      ))}
    </div>
  );
}
