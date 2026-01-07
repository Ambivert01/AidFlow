// src/modules/government/WalletControl.jsx
import { useState } from "react";
import api from "../../services/api";

export default function WalletControl() {
  const [walletId, setWalletId] = useState("");

  const freeze = () =>
    api.post(`/government/wallets/${walletId}/freeze`)
      .then(() => alert("Wallet frozen"));

  const unfreeze = () =>
    api.post(`/government/wallets/${walletId}/unfreeze`)
      .then(() => alert("Wallet unfrozen"));

  return (
    <div className="max-w-md bg-white p-4 shadow rounded">
      <h2 className="font-bold mb-3">Wallet Control</h2>

      <input
        placeholder="Wallet ID"
        className="border p-2 w-full mb-3"
        value={walletId}
        onChange={e => setWalletId(e.target.value)}
      />

      <div className="flex gap-3">
        <button onClick={freeze} className="bg-red-600 text-white px-4 py-2 rounded">
          Freeze
        </button>
        <button onClick={unfreeze} className="bg-green-600 text-white px-4 py-2 rounded">
          Unfreeze
        </button>
      </div>
    </div>
  );
}
