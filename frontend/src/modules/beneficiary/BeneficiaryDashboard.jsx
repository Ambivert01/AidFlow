import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const ALLOWED_CATEGORIES_ICONS = {
  FOOD: "🥫", MEDICINE: "💊", SHELTER: "🏠", WATER: "💧", OTHER: "📦"
};

export default function BeneficiaryDashboard() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [walletsRes, txRes] = await Promise.all([
          api.get("/wallet/me"),
          api.get("/wallet/transactions").catch(() => ({ data: { data: [] } }))
        ]);
        
        const walletData = walletsRes.data?.data ? [walletsRes.data.data] : [];
        setWallets(walletData);
        if (walletData.length > 0) setSelectedWallet(walletData[0]);
        
        const txData = txRes.data?.data || txRes.data || [];
        setTransactions(txData.slice(0, 10));
      } catch (err) {
        console.error("Beneficiary data fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"></div><p>Syncing Vault...</p></div>;

  if (wallets.length === 0) {
    return (
      <div className="stack-lg">
        <div className="page-header border-b pb-6">
          <h1 className="page-title text-2xl font-black">Welcome to AidFlow</h1>
          <p className="page-subtitle text-[var(--color-steel)]">Your aid profile is registered. Awaiting mission assignment.</p>
        </div>
        <div className="card text-center py-24 bg-[var(--color-paper-alt)] border-dashed border-2">
           <div className="text-6xl mb-4">⏳</div>
           <h2 className="text-xl font-bold text-[var(--color-ink)]">Mission Application Pending</h2>
           <p className="max-w-md mx-auto text-[var(--color-steel)] mt-2">
             An NGO can assign you to an active disaster relief mission, or you
             can apply yourself to a campaign. Once approved by AI validation
             and confirmed by the NGO, your wallet will appear here.
           </p>
           <Link to="/beneficiary/apply" className="btn btn-primary mt-6" style={{ display: "inline-flex" }}>
             Apply to a campaign
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-header border-b pb-6">
        <div className="row-between">
          <div>
            <h1 className="page-title text-2xl font-black">My Aid Vault</h1>
            <p className="page-subtitle text-[var(--color-steel)]">Secure digital wallets for disaster relief missions.</p>
          </div>
          <div className="flex gap-2">
             <span className="badge badge-primary bg-primary text-white font-bold">{wallets.length} ACTIVE WALLETS</span>
          </div>
        </div>
      </div>

      <div className="grid-2-1 gap-8">
        <div className="stack gap-6">
          <h3 className="font-bold text-[var(--color-ink)] uppercase tracking-widest text-xs">Mission Wallets</h3>
          {wallets.map(w => (
            <div 
              key={w._id} 
              onClick={() => setSelectedWallet(w)}
              className={`card cursor-pointer transition-all border-l-8 ${
                selectedWallet?._id === w._id ? 'shadow-xl scale-102 border-primary ring-2 ring-primary ring-opacity-10' : 'opacity-70 border-[var(--color-paper-alt)] grayscale'
              }`}
              style={{
                background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
                color: "white",
                minHeight: "200px"
              }}
            >
               <div className="row-between mb-8">
                  <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {w.campaign?.disasterType || 'RELIEF'} MISSION
                  </div>
                  <div className="font-mono text-xs opacity-50">#{w._id.slice(-8).toUpperCase()}</div>
               </div>

               <div className="mb-6">
                  <div className="text-xs uppercase font-bold opacity-60 mb-1">Available Funds</div>
                  <div className="text-5xl font-black tabular-nums">₹{w.balance?.toLocaleString("en-IN")}</div>
               </div>

               <div className="row-between items-end">
                  <div className="stack gap-2">
                    <div className="text-[10px] uppercase font-bold opacity-60">Categories Allowed</div>
                    <div className="flex gap-2">
                       {w.policy?.allowedCategories?.map(cat => (
                         <span key={cat} className="bg-white/10 p-1.5 rounded-lg text-lg tips" title={cat}>
                           {ALLOWED_CATEGORIES_ICONS[cat] || '📦'}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] uppercase font-bold opacity-60">Status</div>
                     <div className="font-black text-sm tracking-widest uppercase">{w.status}</div>
                  </div>
               </div>
            </div>
          ))}
        </div>

        <div className="stack gap-6">
          <h3 className="font-bold text-[var(--color-ink)] uppercase tracking-widest text-xs">Payment Authorization</h3>
          {selectedWallet ? (
            <div className="card text-center overflow-hidden border-0 shadow-lg bg-white">
               <div className="bg-[var(--color-ink)] text-white p-6">
                  <h4 className="font-black text-lg">Generate Secure Pay-Token</h4>
                  <p className="text-[var(--color-steel)] text-xs mt-1">Temporary JWT-signed QR for offline-resistant verify.</p>
               </div>
               <div className="p-8">
                  <div className="aspect-square bg-[var(--color-paper-alt)] flex items-center justify-center rounded-2xl mb-6 relative group border-2 border-[var(--color-paper-alt)]">
                     <span className="text-6xl group-hover:scale-110 transition-transform">📱</span>
                     {selectedWallet.status === 'SUSPENDED' && (
                       <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                          <span className="text-4xl mb-2">❄️</span>
                          <div className="font-bold text-[var(--color-alert)]">WALLET FROZEN</div>
                          <p className="text-[10px] text-[var(--color-steel)] mt-1">Audit verification in progress</p>
                       </div>
                     )}
                  </div>
                  <Link 
                    to={selectedWallet.status === 'ACTIVE' ? `/beneficiary/qr?walletId=${selectedWallet._id}` : '#'} 
                    className={`btn btn-primary btn-lg w-full py-4 rounded-xl font-black tracking-widest uppercase text-sm ${selectedWallet.status !== 'ACTIVE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Generate Entry Hash
                  </Link>
                  <p className="text-[10px] text-[var(--color-steel)] mt-4 leading-relaxed italic">
                    * Tokens are cryptographically tied to {selectedWallet.campaign?.title} policy.
                  </p>
               </div>
            </div>
          ) : (
            <div className="card text-center py-12 bg-[var(--color-paper-alt)] border-[var(--color-paper-alt)]">
               <p className="text-[var(--color-steel)] text-xs font-bold uppercase">Select a wallet to generate pay-token</p>
            </div>
          )}
        </div>
      </div>

      {/* Unified Transaction History */}
      <div className="card shadow-sm border-0 border-t-4 border-[var(--color-ink)]">
        <div className="row-between mb-6">
          <h3 className="text-lg font-bold text-[var(--color-ink)] tracking-tight">Recent Purchases</h3>
          <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Download Audit Log</button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="empty-state py-12 text-center bg-[var(--color-paper-alt)] rounded-xl">
             <div className="text-3xl mb-2">🏷️</div>
             <p className="text-sm font-bold text-[var(--color-steel)] uppercase tracking-widest">No spending recorded</p>
             <p className="text-xs text-[var(--color-steel)]">Your immutable transaction chain is currently empty.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-paper-alt)]">
            {transactions.map(tx => (
              <div key={tx._id} className="py-4 row-between hover:bg-[var(--color-paper-alt)] transition-colors px-2 rounded-lg">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-paper-alt)] flex items-center justify-center text-2xl shadow-inner">
                    {ALLOWED_CATEGORIES_ICONS[tx.category] || "📦"}
                  </div>
                  <div>
                    <div className="font-black text-[var(--color-ink)] text-[15px]">{tx.merchantName || "Verified Relief Merchant"}</div>
                    <div className="text-[11px] text-[var(--color-steel)] font-mono mt-1">
                      {new Date(tx.timestamp).toLocaleString("en-IN", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-[var(--color-ink)] tabular-nums">-₹{tx.amount?.toLocaleString("en-IN")}</div>
                  <div className="text-[9px] font-black uppercase text-[var(--color-steel)] tracking-tighter mt-1">{tx.category} Category</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
