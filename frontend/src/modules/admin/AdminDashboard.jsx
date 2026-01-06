import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await api.get("/admin/access/pending");
    setRequests(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    await api.post(`/admin/access/${id}/approve`);
    load();
  };

  const reject = async (id) => {
    const reason = prompt("Rejection reason?");
    if (!reason) return;
    await api.post(`/admin/access/${id}/reject`, { reason });
    load();
  };

  if (loading) return <Loader text="Loading requests..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Access Requests</h1>

      {requests.length === 0 && (
        <p className="text-gray-500">No pending requests</p>
      )}

      {requests.map((u) => (
        <div
          key={u._id}
          className="bg-white border rounded p-4 shadow"
        >
          <p><b>Name:</b> {u.name}</p>
          <p><b>Email:</b> {u.email}</p>
          <p><b>Role:</b> {u.role}</p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => approve(u._id)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Approve
            </button>
            <button
              onClick={() => reject(u._id)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
