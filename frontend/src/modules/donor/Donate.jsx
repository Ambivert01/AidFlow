import { useState, useRef } from "react";
import { donateToCampaign } from "../../services/donor.service";

/**
 * Generate a unique idempotency key
 * Format: timestamp-random-campaignId
 */
const generateIdempotencyKey = (campaignId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `donation-${timestamp}-${random}-${campaignId}`;
};

export default function Donate({ campaign, onClose }) {
  const [amount, setAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [donationId, setDonationId] = useState(null);

  // Use ref to store idempotency key - persists across re-renders
  const idempotencyKeyRef = useRef(null);

  // Track if donation was already submitted
  const submittedRef = useRef(false);

  const handleDonate = async () => {
    // Prevent duplicate submissions
    if (submittedRef.current || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      submittedRef.current = true; // Mark as submitted

      // Generate idempotency key if not already generated
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = generateIdempotencyKey(campaign._id);
      }

      // Call donation service with idempotency key
      const result = await donateToCampaign({
        campaignId: campaign._id,
        amount,
        idempotencyKey: idempotencyKeyRef.current,
      });

      const donationPayload = result?.data?.data || result?.data;
      if (donationPayload?._id) {
        setDonationId(donationPayload._id);
      }

      setSuccess(true);

      // Close after a delay long enough to actually read the inline
      // success message below (was previously paired with a blocking
      // native alert() dialog, which has been removed - it was jarring
      // and inconsistent with the rest of the app's design language).
      setTimeout(() => {
        onClose();
      }, 3500);
    } catch (err) {
      console.error("[Donate] Donation failed:", err);

      // Check if it's a duplicate error (409 Conflict)
      if (err.response?.status === 409) {
        setError(
          "This donation was already processed. Please check your donation history.",
        );
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Donation failed. Please try again.");
      }

      // Allow retry on error
      submittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setAmount(5000);
    setError("");
    setSuccess(false);
    setDonationId(null);
    idempotencyKeyRef.current = null;
    submittedRef.current = false;
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-2">Donate to {campaign.title}</h3>

      {/* Campaign Info */}
      <div className="bg-[var(--color-paper-alt)] p-3 rounded mb-4 text-sm">
        <div className="flex justify-between mb-1">
          <span className="text-[var(--color-steel)]">Target Amount:</span>
          <span className="font-semibold">
            ₹{campaign.targetAmount?.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-steel)]">Already Raised:</span>
          <span className="font-semibold">
            ₹{campaign.totalDonated?.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--color-alert-light)] border border-[var(--color-alert-light)] text-[var(--color-alert-dark)] px-4 py-3 rounded mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-[var(--color-verified-light)] border border-[var(--color-verified-light)] text-[var(--color-verified-dark)] px-4 py-3 rounded mb-4">
          <p className="text-sm font-semibold">
            ✅ Donation submitted successfully
          </p>
          {donationId && (
            <p className="text-xs mt-1 font-mono">ID: {donationId}</p>
          )}
          <p className="text-xs mt-2">
            Next: AI risk evaluation → NGO review → blockchain anchoring → audit trail. Track every step from your donation history.
          </p>
        </div>
      )}

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
          Donation Amount (₹)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min="1"
          step="100"
          disabled={loading || success}
          className="border border-[var(--color-steel)] px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)] disabled:bg-[var(--color-paper-alt)] disabled:cursor-not-allowed"
          placeholder="Enter amount"
        />
        <p className="text-xs text-[var(--color-steel)] mt-1">
          Minimum: ₹1 | Suggested: ₹5,000
        </p>
      </div>

      {/* Quick Amount Buttons */}
      {!success && (
        <div className="flex gap-2 mb-4">
          {[1000, 5000, 10000, 25000].map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => setAmount(quickAmount)}
              disabled={loading}
              className="flex-1 border border-[var(--color-steel)] px-2 py-1 rounded text-sm hover:bg-[var(--color-paper-alt)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ₹{(quickAmount / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
      )}

      {/* Processing State */}
      {loading && (
        <div className="bg-[var(--color-signal-light)] border border-[var(--color-signal-light)] text-[var(--color-signal-dark)] px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-signal-dark)] mr-3"></div>
            <p className="text-sm">Processing your donation...</p>
          </div>
          <p className="text-xs mt-2 text-[var(--color-signal)]">
            Please wait. Do not close this window or refresh the page.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {!success ? (
          <>
            <button
              onClick={handleDonate}
              disabled={loading || amount < 1}
              className="flex-1 bg-[var(--color-signal)] text-white px-4 py-2 rounded font-medium hover:bg-[var(--color-signal-dark)] disabled:bg-[var(--color-steel)] disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Processing...
                </span>
              ) : (
                `Donate ₹${amount.toLocaleString("en-IN")}`
              )}
            </button>

            <button
              onClick={onClose}
              disabled={loading}
              className="border border-[var(--color-steel)] px-4 py-2 rounded hover:bg-[var(--color-paper-alt)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onClose}
              className="flex-1 bg-[var(--color-verified)] text-white px-4 py-2 rounded font-medium hover:bg-[var(--color-verified-dark)]"
            >
              Done
            </button>
            <button
              onClick={handleReset}
              className="border border-[var(--color-steel)] px-4 py-2 rounded hover:bg-[var(--color-paper-alt)]"
            >
              Donate Again
            </button>
          </>
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-4 text-xs text-[var(--color-steel)] bg-[var(--color-paper-alt)] p-3 rounded">
        <p className="font-semibold mb-1">🔒 Secure Donation Process</p>
        <ul className="list-disc list-inside space-y-1">
          <li>AI-powered fraud detection</li>
          <li>Blockchain-anchored transparency</li>
          <li>Complete audit trail</li>
          <li>Duplicate prevention enabled</li>
        </ul>
      </div>
    </div>
  );
}
