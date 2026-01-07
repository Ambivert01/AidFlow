import { useEffect, useState } from "react";
import { fetchCampaigns, fetchMyDonations } from "../../services/donor.service";
import Donate from "./Donate";

import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";
import { ROLES } from "../../utils/constants";

export default function DonorDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    fetchCampaigns().then(setCampaigns);
    fetchMyDonations().then((res) => setDonations(res.data));
  }, []);

  return (
    <div className="space-y-10">
      {/* ROLE CONTEXT */}
      <RoleContextBanner
        role={ROLES.DONOR}
        message="Donate to verified campaigns and track every rupee through an immutable audit trail."
      />

      {/* ================= ACTIVE CAMPAIGNS ================= */}
      <section>
        <InfoNotice
          title="Active Relief Campaigns"
          message="These campaigns are verified and policy-locked. Donations are processed through AI checks and recorded immutably."
        />

        <h2 className="text-2xl font-bold mb-4">Donate to a Campaign</h2>

        {campaigns.length === 0 && (
          <p className="text-gray-500">No active campaigns at the moment.</p>
        )}

        {campaigns.map((c) => (
          <div key={c._id} className="border p-4 rounded mb-4 bg-white">
            <h3 className="font-semibold text-lg">{c.title}</h3>
            <p className="text-sm text-gray-600">{c.description}</p>

            {/* POLICY SNAPSHOT */}
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer font-medium">
                Policy Snapshot (Locked)
              </summary>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
                {JSON.stringify(c.policySnapshot, null, 2)}
              </pre>
            </details>

            <button
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
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

      {/* ================= MY DONATIONS ================= */}
      <section>
        <InfoNotice
          title="Your Donation Transparency"
          message="Each donation generates an immutable audit trail that can be verified publicly."
        />

        <h2 className="text-xl font-bold mb-3">My Donations</h2>

        {donations.length === 0 && (
          <p className="text-gray-500">
            You haven’t donated yet. Once you do, audit proofs will appear here.
          </p>
        )}

        {donations.map((d) => (
          <div
            key={d.donationId}
            className="border p-4 rounded mb-4 bg-gray-50 space-y-2"
          >
            <p>
              <b>Campaign:</b> {d.campaign?.title}
            </p>
            <p>
              <b>Amount:</b> ₹{d.amount}
            </p>

            <p>
              <b>Status:</b>{" "}
              {d.status === "READY_FOR_USE"
                ? "Funds Released (Verified)"
                : d.status.replaceAll("_", " ")}
            </p>

            {/* AUDIT ID */}
            <div className="bg-white border rounded p-2 flex justify-between items-center">
              <div className="text-xs break-all">
                <b>Audit ID:</b> {d.donationId}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(d.donationId);
                  alert("Audit ID copied");
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
              >
                Copy
              </button>
            </div>

            {/* AUDIT STATUS */}
            {d.auditHash ? (
              <p className="text-green-700 text-sm">
                ✔ Audit finalized & anchored on blockchain
              </p>
            ) : (
              <p className="text-yellow-600 text-sm">
                ⏳ Audit proof processing…
              </p>
            )}

            {/* PUBLIC VERIFY */}
            <a href="/public" className="text-blue-600 text-sm underline">
              Verify publicly
            </a>
            <a
              href={`/donor/timeline/${d.donationId}`}
              className="text-sm text-blue-700 underline"
            >
              View full audit timeline
            </a>
          </div>
        ))}
      </section>
    </div>
  );
}
