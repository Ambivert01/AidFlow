import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchDonationTimeline } from "../../services/donor.service";
import Loader from "../../components/Loader";

export default function DonationTimeline() {
  const { id } = useParams();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonationTimeline(id)
      .then(res => setSteps(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader text="Fetching impact timeline..." />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Impact Timeline</h2>

      <div className="border-l-2 border-blue-500 pl-6 space-y-6">
        {steps.map((s, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-3 top-1 h-3 w-3 bg-blue-500 rounded-full"></span>
            <p>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
