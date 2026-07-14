import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function PublicCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [disasterFilter, setDisasterFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (disasterFilter) params.disasterType = disasterFilter;
      if (locationFilter) params.q = locationFilter;
      const res = await api.get("/public/campaigns", { params });
      setCampaigns(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [disasterFilter, locationFilter]);

  return (
    <div className="stack-lg animate-fade-up" style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--space-6)" }}>
      
      <div className="page-header text-center" style={{ marginBottom: "var(--space-8)" }}>
         <h1 className="page-title">Active Response Campaigns</h1>
         <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0 auto" }}>
           Browse fully transparent humanitarian programs. Every donation is governed by smart policies and audited via zero-trust ledgers.
         </p>
      </div>

      <div className="card shadow-md" style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
         <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
            <label className="form-label">Disaster Type</label>
            <select className="form-input" value={disasterFilter} onChange={(e) => setDisasterFilter(e.target.value)}>
               <option value="">All Crises</option>
               <option value="FLOOD">Flood Relief</option>
               <option value="EARTHQUAKE">Earthquake Recovery</option>
               <option value="FAMINE">Famine / Food Shortage</option>
               <option value="WAR">Conflict Zones</option>
               <option value="DROUGHT">Drought Response</option>
               <option value="PANDEMIC">Pandemic / Health Crisis</option>
            </select>
         </div>
         <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
            <label className="form-label">Location (Keyword)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Kerala, Syria, etc."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
         </div>
         <button className="btn btn-ghost" onClick={() => { setDisasterFilter(""); setLocationFilter(""); }}>
            Clear Filters
         </button>
      </div>

      {loading ? (
        <div className="loader-center"><div className="spinner"/></div>
      ) : campaigns.length === 0 ? (
         <div className="empty-state">
           <div className="empty-state-icon">🌍</div>
           <div className="empty-state-title">No campaigns found</div>
           <div className="empty-state-desc">Try adjusting your filters or checking back later.</div>
         </div>
      ) : (
         <div className="grid-3 mt-4">
            {campaigns.map(c => {
               const policySnapshot = c.policySnapshot || c.policy || {};
               const categories = policySnapshot.allowedCategories || ["ALL"];
               const cap = policySnapshot.maxPerBeneficiary ?? "N/A";
               const locationText = [c.location?.ward, c.location?.district, c.location?.state].filter(Boolean).join(", ");
               
               return (
                 <div key={c._id} className="card stack shadow-md" style={{ display: "flex", flexDirection: "column" }}>
                    <div className="row-between">
                       <span className="badge badge-blue">{c.disasterType}</span>
                       <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 style={{ fontSize: "18px", fontWeight: "800", marginTop: "8px" }}>{c.title}</h3>
                    <div style={{ fontSize: "13px", color: "var(--color-primary)", fontWeight: "600", marginBottom: "8px" }}>
                       📍 {locationText || "Location not disclosed"}
                    </div>
                    
                    <p style={{ fontSize: "13px", color: "var(--color-text-muted)", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                       {c.description}
                    </p>

                    <div style={{ padding: "12px", background: "var(--color-surface-alt)", borderRadius: "6px", marginTop: "auto", border: "1px dashed var(--color-border)" }}>
                       <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-secondary)", marginBottom: "4px" }}>
                         Smart Contract Policy
                       </div>
                       <div className="row" style={{ gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
                          {categories.map(cat => (
                            <span key={cat} style={{ background: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", border: "1px solid var(--color-border)" }}>
                              {cat}
                            </span>
                          ))}
                       </div>
                       <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        Cap: <strong>{cap === "N/A" ? "N/A" : `₹${Number(cap).toLocaleString("en-IN")}`}</strong> / beneficiary
                       </div>
                    </div>

                    <div className="row-between mt-4">
                      <div className="stack" style={{ gap: "2px" }}>
                         <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>NGO Organizer</span>
                         <span style={{ fontSize: "13px", fontWeight: "600" }}>{c.createdBy?.name || "Verified NGO"}</span>
                      </div>
                      <Link to={`/donor/campaigns/${c._id}/donate`} className="btn btn-primary btn-sm">
                         Fund This
                      </Link>
                    </div>
                 </div>
               );
            })}
         </div>
      )}

    </div>
  );
}
