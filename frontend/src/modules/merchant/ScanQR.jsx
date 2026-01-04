export default function ScanQR() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Scan Beneficiary QR</h2>

      <div className="bg-white p-4 shadow rounded">
        <p>📷 QR Scanner Placeholder</p>

        <div className="mt-4">
          <p><b>Wallet Status:</b> Valid</p>
          <p><b>Allowed:</b> Food, Medicine</p>
          <p><b>Attempted Category:</b> Electronics </p>

          <p className="text-red-600 mt-2">
            Transaction Blocked (Policy Violation)
          </p>
        </div>
      </div>
    </div>
  );
}
