import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../../services/api";

const CATEGORY_ICONS = {
  FOOD: "🥫", MEDICINE: "💊", SHELTER: "🏠", WATER: "💧", OTHER: "📦"
};

export default function ConfirmPayment() {
  const location = useLocation();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Payload passed from the QR scan view (now flat fields)
  const { wallet, qrToken } = location.state || {};

  if (!wallet || !qrToken) {
    return (
      <div className="empty-state p-12 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <div className="empty-state-title font-bold text-xl">No Scanned Data</div>
        <p className="text-slate-500">Please scan a beneficiary QR first.</p>
        <Link to="/merchant/scan" className="btn btn-primary mt-6">Go to Scanner</Link>
      </div>
    );
  }

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!category) {
      setError("Please select a valid commodity category.");
      return;
    }

    setLoading(true); setError(""); setSuccess(null);
    try {
      const res = await api.post("/payments/confirm", {
        qrToken,
        amount: Number(amount),
        category
      });

      setSuccess({
        transactionId: res.data.transactionId,
        remainingBalance: res.data.remainingBalance,
        amount: Number(amount),
        category
      });
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Policy violation or insufficient balance.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="stack-lg max-w-lg mx-auto py-12">
        <div className="card text-center p-12 shadow-2xl border-t-8 border-green-500">
          <div className="text-7xl mb-6">✨</div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Transaction Verified</h2>
          <p className="text-slate-500 mb-8 font-medium">₹{success.amount.toLocaleString("en-IN")} processed for {success.category}.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 mb-8">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
               <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Digital Receipt</span>
               <span className="badge badge-success bg-green-100 text-green-700 font-bold text-[9px] px-2 py-1">IMMUTABLE</span>
            </div>
            <div className="stack gap-3 font-mono text-xs text-slate-600">
              <div className="flex justify-between">
                 <span>TXID:</span>
                 <span className="font-bold text-slate-900">{success.transactionId.slice(0,12)}...{success.transactionId.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                 <span>REMAINING:</span>
                 <span className="font-bold text-slate-900">₹{success.remainingBalance?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <Link to="/merchant/scan" className="btn btn-ghost flex-1 py-4 font-bold border-2 border-slate-200">Scan Next</Link>
             <Link to="/merchant" className="btn btn-primary flex-1 py-4 font-bold">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg max-w-lg mx-auto py-8 px-4">
      <div className="page-header mb-8">
        <h1 className="page-title text-3xl font-black text-slate-900">Final Verification</h1>
        <p className="page-subtitle text-slate-500">Verify aid eligibility and authorize fund release.</p>
      </div>

      <div className="card shadow-xl p-0 overflow-hidden border-0">
        <div className="bg-slate-900 text-white p-6">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">👤</div>
                 <div>
                    <div className="font-black text-lg">Verified Beneficiary</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">ID: {wallet.beneficiaryId?.slice(-8)}</div>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-bold text-slate-400 uppercase">Available</div>
                 <div className="text-2xl font-black text-green-400 tabular-nums">₹{wallet.balance?.toLocaleString("en-IN")}</div>
              </div>
           </div>
        </div>

        <div className="p-8 stack gap-8">
          {error && <div className="alert alert-danger bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-bold text-sm">⚠️ {error}</div>}

          <section>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Step 1: Select Commodity Category</h3>
            <div className="grid grid-cols-2 gap-3">
              {wallet.allowedCategories?.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${category === cat ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-100 bg-white grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat] || "📦"}</span>
                  <span className="font-black text-xs text-slate-700">{cat}</span>
                </button>
              ))}
            </div>
          </section>

          <form onSubmit={handleConfirm} className="stack gap-6">
            <div className="form-group">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Step 2: Transaction Amount</h3>
              <div className="relative">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">₹</span>
                 <input
                   type="number"
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 pl-12 text-5xl font-black tabular-nums focus:border-primary focus:ring-0 transition-all outline-none"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0"
                   min="1"
                   max={wallet.balance}
                   required
                   disabled={loading}
                 />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Cannot exceed mission policy limits or wallet balance.</p>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg w-full py-6 rounded-3xl font-black text-lg tracking-widest uppercase shadow-lg shadow-primary/30 disabled:opacity-50" 
              disabled={loading || !amount || !category || amount > wallet.balance}
            >
              {loading ? "Authorizing Chain..." : `Confirm Payment of ₹${amount || "0"}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
