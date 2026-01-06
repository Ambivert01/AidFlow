import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";

import { useEffect, useState } from "react";
import { fetchCampaigns, fetchMyDonations } from "../../services/donor.service";
import Donate from "./Donate";

export default function DonorDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    fetchCampaigns().then(setCampaigns);
    fetchMyDonations().then((res) => setDonations(res.data));
  }, []);

  return (
    <div className="space-y-8">
      <RoleContextBanner
        role="DONOR"
        message="You can donate to active campaigns and publicly verify how your donations are used."
      />

      {/* ACTIVE CAMPAIGNS */}
      <section>
        <InfoNotice
          title="Available Relief Campaigns"
          message="These are active, verified campaigns where you can donate. Each donation will be processed through AI checks and recorded on blockchain."
        />

        <h1 className="text-2xl font-bold mb-4">Active Campaigns</h1>

        {Array.isArray(campaigns) &&
          campaigns.map((c) => (
            <div key={c._id} className="border p-4 rounded mb-3">
              <h2 className="font-semibold">{c.title}</h2>
              <p>{c.description}</p>

              <button
                className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
                onClick={() => setSelected(c)}
              >
                Donate
              </button>
            </div>
          ))}

        {selected && (
          <Donate campaign={selected} onClose={() => setSelected(null)} />
        )}
      </section>

      {/* MY DONATIONS — TRANSPARENCY */}
      <section>
        <InfoNotice
          title="Available Relief Campaigns"
          message="These are active, verified campaigns where you can donate. Each donation will be processed through AI checks and recorded on blockchain."
        />

        <h2 className="text-xl font-bold mb-3">My Donations (Transparency)</h2>

        {donations.length === 0 && (
          <p className="text-gray-500">
            You haven’t made any donations yet. Once you donate, audit proofs
            will appear here.
          </p>
        )}

        {donations.map((d) => (
          <div
            key={d.donationId}
            className="border p-4 rounded mb-3 bg-gray-50"
          >
            <p>
              <b>Campaign:</b> {d.campaign?.title}
            </p>
            <p>
              <b>Amount:</b> ₹{d.amount}
            </p>
            <p>
              <b>Status:</b> {d.status}
            </p>

            {d.auditHash ? (
              <p className="text-green-700 break-all">
                <b>Audit Hash:</b> {d.auditHash}
              </p>
            ) : (
              <p className="text-yellow-600">Audit proof processing…</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
