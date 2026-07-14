import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRecentTransactions } from "../../services/public.service";

export default function AuditPreview() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await getRecentTransactions(10);
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section
        className="animate-fade-up"
        style={{
          padding: "var(--space-12) var(--space-4)",
          maxWidth: "1200px",
          margin: "0 auto",
          background: "var(--color-surface)",
        }}
      >
        <div className="loader-center" style={{ minHeight: "200px" }}>
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <section
      className="animate-fade-up"
      style={{
        padding: "var(--space-12) var(--space-4)",
        maxWidth: "1200px",
        margin: "0 auto",
        background: "var(--color-surface)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "var(--space-2)",
          }}
        >
          The ledger, unedited
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          The ten most recent donations, with the hash that anchors each one. No login required to check it.
        </p>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--color-surface-alt)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th
                  style={{
                    padding: "var(--space-3)",
                    textAlign: "left",
                    fontWeight: "600",
                  }}
                >
                  Donor
                </th>
                <th
                  style={{
                    padding: "var(--space-3)",
                    textAlign: "left",
                    fontWeight: "600",
                  }}
                >
                  Campaign
                </th>
                <th
                  style={{
                    padding: "var(--space-3)",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    padding: "var(--space-3)",
                    textAlign: "left",
                    fontWeight: "600",
                  }}
                >
                  Hash
                </th>
                <th
                  style={{
                    padding: "var(--space-3)",
                    textAlign: "left",
                    fontWeight: "600",
                  }}
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  className="animate-fade-up"
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  <td style={{ padding: "var(--space-3)" }}>{tx.donor}</td>
                  <td style={{ padding: "var(--space-3)" }}>
                    <div>{tx.campaign}</div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {tx.disasterType}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "var(--space-3)",
                      textAlign: "right",
                      fontWeight: "600",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: "var(--space-3)" }}>
                    <code
                      style={{
                        fontSize: "11px",
                        background: "var(--color-ink)",
                        color: "var(--color-verified-light)",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {tx.hash}
                    </code>
                  </td>
                  <td
                    style={{
                      padding: "var(--space-3)",
                      color: "var(--color-text-muted)",
                      fontSize: "13px",
                    }}
                  >
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
        <Link to="/public-audit" className="btn btn-ghost">
          View Full Audit Trail →
        </Link>
      </div>
    </section>
  );
}
