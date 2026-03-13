import { useEffect, useState } from "react";
import * as adminSvc from "../../services/admin.service";

const EVENT_LABELS = {
  DONATION_CREATED: "Donation Created",
  DONATION_APPROVED_BY_NGO: "NGO Approved Donation",
  DONATION_REJECTED_BY_NGO: "NGO Rejected Donation",
  BENEFICIARY_REGISTERED: "Beneficiary Registered",
  BENEFICIARY_APPROVED_BY_NGO: "NGO Approved Beneficiary",
  BENEFICIARY_REJECTED_BY_NGO: "NGO Rejected Beneficiary",
  WALLET_CREATED: "Wallet Created",
  WALLET_SPENT: "Aid Spent at Merchant",
  WALLET_FROZEN: "Wallet Frozen",
  WALLET_UNFROZEN: "Wallet Unfrozen",
  MERCHANT_CATEGORY_VIOLATION: "⚠️ Category Violation",
  WORKFLOW_AUDIT_FINALIZED: "Audit Finalized & Anchored",
  CAMPAIGN_CREATED: "Campaign Created",
  CAMPAIGN_ACTIVATED: "Campaign Activated",
  USER_ACCESS_APPROVED: "Access Approved",
  USER_ACCESS_REJECTED: "Access Rejected",
  USER_SUSPENDED: "User Suspended",
};

const ACTOR_BADGE = {
  DONOR: "badge-teal",
  NGO: "badge-blue",
  MERCHANT: "badge-purple",
  BENEFICIARY: "badge-yellow",
  GOVERNMENT: "badge-orange",
  ADMIN: "badge-red",
  SYSTEM: "badge-gray",
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminSvc.getAuditLogs({
        eventType: eventFilter || undefined,
        actorRole: actorFilter || undefined,
        limit: 100,
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error("Audit logs error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventFilter, actorFilter]);

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Immutable Audit Log</h1>
        <p className="page-subtitle">Cryptographically hashed event history. Every action on the platform — tamper-evident.</p>
      </div>

      <div className="card" style={{ padding: "var(--space-4)" }}>
        <div className="row gap-4" style={{ flexWrap: "wrap" }}>
          <select className="form-input" value={actorFilter} onChange={e => { setActorFilter(e.target.value); }} style={{ maxWidth: "200px" }}>
            <option value="">All Actors</option>
            {["DONOR","NGO","MERCHANT","BENEFICIARY","GOVERNMENT","ADMIN","SYSTEM"].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select className="form-input" value={eventFilter} onChange={e => setEventFilter(e.target.value)} style={{ maxWidth: "280px" }}>
            <option value="">All Events</option>
            {Object.keys(EVENT_LABELS).map(ev => (
              <option key={ev} value={ev}>{EVENT_LABELS[ev]}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginLeft: "auto" }}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="card skeleton" style={{ height: "400px" }} />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Campaign</th>
                  <th>Hash</th>
                  <th>Anchored</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-faint)" }}>No logs found</td></tr>
                ) : logs.map(log => (
                  <tr key={log._id}>
                    <td style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--color-text-muted)" }}>
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td style={{ fontSize: "12px", fontWeight: "600" }}>
                      {EVENT_LABELS[log.eventType] || log.eventType.replaceAll("_", " ")}
                    </td>
                    <td>
                      <span className={`badge ${ACTOR_BADGE[log.actorRole] || "badge-gray"}`}>{log.actorRole}</span>
                    </td>
                    <td style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      {log.campaignId?.title || "—"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--color-text-faint)"}}>
                      {log.hash ? log.hash.slice(0, 16) + "…" : "—"}
                    </td>
                    <td>
                      {log.merkleRoot ? (
                        <span className="badge badge-green" style={{ fontSize: "9px" }}>✓ Anchored</span>
                      ) : (
                        <span className="badge badge-gray" style={{ fontSize: "9px" }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-faint)", textAlign: "right", marginTop: "var(--space-2)" }}>
            Showing {logs.length} records (most recent 100)
          </div>
        </div>
      )}
    </div>
  );
}
