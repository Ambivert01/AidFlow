import { useState } from "react";
import api from "../../services/api";

export default function ConfirmPayment() {
  const [paymentId, setPaymentId] = useState("");

  const confirm = () => {
    api.post("/payments/merchant-confirm", { paymentId })
      .then(() => alert("Payment confirmed"))
      .catch(() => alert("Confirmation failed"));
  };

  return (
    <div className="bg-white p-5 rounded shadow max-w-md mt-6">
      <h2 className="text-lg font-semibold mb-3">Confirm Payment</h2>

      <input
        placeholder="Payment ID"
        className="input w-full"
        value={paymentId}
        onChange={e => setPaymentId(e.target.value)}
      />

      <button onClick={confirm} className="btn-primary w-full mt-3">
        Confirm
      </button>
    </div>
  );
}
