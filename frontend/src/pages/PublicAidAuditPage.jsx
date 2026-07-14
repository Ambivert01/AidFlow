import { useState } from "react";
import PublicAudit from "../modules/public/PublicAudit";
import VerifyHash from "../modules/public/VerifyHash";

export default function PublicAidAuditPage() {
  const [activeTab, setActiveTab] = useState("trace");

  return (
    <div className="center-page animate-fade-up" style={{ padding: "var(--space-6)", alignContent: "flex-start" }}>
      <div className="stack-lg" style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>

         <div className="card text-center hover-lift" style={{ background: "var(--color-primary-dark)", color: "white", padding: "var(--space-8)", border: "none", transition: "all 0.3s ease" }}>
            <h1 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "var(--space-2)" }}>Network Transparency Ledger</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: "500px", margin: "0 auto", fontSize: "14px" }}>
              AidFlow operates on a Zero-Trust architecture. Don't trust us—verify the cryptographic execution of humanitarian aid yourself.
            </p>
         </div>

         {/* Audit Tools Tabs */}
         <div className="row" style={{ justifyContent: "center", gap: "var(--space-2)", margin: "var(--space-4) 0" }}>
            <button 
              className={`btn ${activeTab === 'trace' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('trace')}
            >
               Trace a Donation (Job ID)
            </button>
            <button 
              className={`btn ${activeTab === 'merkle' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('merkle')}
            >
               What is this?
            </button>
            <button 
              className={`btn ${activeTab === 'verify' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('verify')}
            >
               Verify a File Hash
            </button>
         </div>

         {activeTab === 'verify' && (
            <div className="fade-in animate-fade-up">
               <VerifyHash />
            </div>
         )}

         {activeTab === 'trace' && (
            <div className="fade-in animate-fade-up">
               <PublicAudit />
            </div>
         )}

         {activeTab === 'merkle' && (
            <div className="card stack shadow-lg fade-in animate-fade-up" style={{ padding: "var(--space-8)" }}>
               <h2 style={{ fontSize: "24px", fontWeight: "800" }}>How AidFlow Auditing Works</h2>
               <p style={{ color: "var(--color-text-muted)", lineHeight: "1.6" }}>
                 Traditional aid organizations rely on internal databases that can be altered or deleted. AidFlow uses a cryptographic append-only ledger.
               </p>
               
               <div className="grid-2" style={{ marginTop: "var(--space-4)" }}>
                  {[
                    { num: "01", title: "State Changes are Hashed", desc: "Every time a donation changes hands (Donor → NGO → Beneficiary → Merchant), the event payload is cryptographically hashed (SHA-256)." },
                    { num: "02", title: "Merkle Trees are Built", desc: "Related events are mathematically combined into a single \"Merkle Root\" hash that represents the entire workflow." },
                    { num: "03", title: "Blockchain Anchoring", desc: "That single Merkle Root is broadcasted to an immutable public blockchain (e.g., Ethereum) to permanently lock the history." },
                    { num: "04", title: "Public Verification", desc: "Anyone can independently calculate the hash and verify it exists on the blockchain, proving zero funds were diverted." },
                  ].map((item, idx) => (
                    <div key={idx} className="stack hover-lift animate-fade-up" style={{ gap: "8px", animationDelay: `${idx * 0.1}s`, transition: "all 0.3s ease" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: "var(--color-signal)" }}>{item.num}</div>
                      <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{item.title}</h3>
                      <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{item.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
