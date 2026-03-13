import { useEffect, useState } from "react";
import * as adminSvc from "../../services/admin.service";

const ROLE_BADGE = {
  ADMIN: "badge-purple",
  GOVERNMENT: "badge-blue",
  NGO: "badge-green",
  DONOR: "badge-teal",
  BENEFICIARY: "badge-yellow",
  MERCHANT: "badge-orange",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminSvc.getUsers({ role: roleFilter || undefined, status: statusFilter || undefined, page, limit: 30 });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Admin users load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, roleFilter, statusFilter]);

  const handleToggle = async (id, name, isActive) => {
    if (!window.confirm(`${isActive ? "Suspend" : "Restore"} ${name}?`)) return;
    try {
      const res = await adminSvc.toggleUserActive(id);
      setActionMsg(res.data.message || "Updated");
      load();
      setTimeout(() => setActionMsg(""), 3000);
    } catch {
      setActionMsg("Action failed.");
    }
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">User Directory</h1>
        <p className="page-subtitle">Manage all platform accounts. Suspend or restore access at any time.</p>
      </div>

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}

      {/* Filters */}
      <div className="card" style={{ padding: "var(--space-4)" }}>
        <div className="row gap-4" style={{ flexWrap: "wrap" }}>
          <select className="form-input" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ maxWidth: "180px" }}>
            <option value="">All Roles</option>
            {["ADMIN","GOVERNMENT","NGO","DONOR","BENEFICIARY","MERCHANT"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="form-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ maxWidth: "180px" }}>
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div style={{ marginLeft: "auto", fontSize: "13px", color: "var(--color-text-muted)", alignSelf: "center" }}>
            {total} total users
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card skeleton" style={{ height: "300px" }} />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-faint)" }}>No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{u.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{u.email}</div>
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || "badge-gray"}`}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.verificationStatus === "APPROVED" ? "badge-green" : u.verificationStatus === "PENDING" ? "badge-yellow" : "badge-red"}`}>
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                        {u.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      {u.role !== "ADMIN" && (
                        <button
                          className={`btn btn-sm ${u.isActive ? "btn-ghost" : "btn-primary"}`}
                          style={{ fontSize: "11px", color: u.isActive ? "var(--color-danger)" : undefined, borderColor: u.isActive ? "var(--color-danger)" : undefined }}
                          onClick={() => handleToggle(u._id, u.name, u.isActive)}
                        >
                          {u.isActive ? "Suspend" : "Restore"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 30 && (
            <div className="row" style={{ justifyContent: "center", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ alignSelf: "center", fontSize: "13px" }}>Page {page}</span>
              <button className="btn btn-ghost btn-sm" disabled={users.length < 30} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
