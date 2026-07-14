import { useState } from "react";
import PropTypes from "prop-types";
import LazyImage from "../../../components/LazyImage";

/**
 * ProofViewer Component
 *
 * Displays proof files (images, videos, PDFs) with AI validation and manual review results.
 * Features:
 * - Multi-file viewing support
 * - AI validation results display
 * - Manual review results display
 * - Location data visualization
 * - File type detection and appropriate rendering
 */
export default function ProofViewer({ proof, compact = false }) {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!proof) {
    return (
      <div className="empty-state" style={{ padding: "var(--space-4)" }}>
        <div className="empty-state-icon">📄</div>
        <div className="empty-state-title">No proof available</div>
      </div>
    );
  }

  const files = proof.files || [];
  const selectedFile = files[selectedFileIndex];

  // Determine file type
  const getFileType = (file) => {
    if (!file?.url) return "unknown";
    const ext = file.url.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["mp4", "webm", "mov"].includes(ext)) return "video";
    if (ext === "pdf") return "pdf";
    return "unknown";
  };

  // Get validation status color
  const getValidationColor = (status) => {
    if (status === "APPROVED" || status === "VERIFIED")
      return "var(--color-success)";
    if (status === "REJECTED" || status === "FAILED")
      return "var(--color-danger)";
    if (status === "PENDING") return "var(--color-caution)";
    return "var(--color-text-muted)";
  };

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
      }}
    >
      {/* Proof Header */}
      <div
        style={{
          padding: "var(--space-3)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-alt)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-2)",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "700",
              margin: 0,
            }}
          >
            📎 Proof of Impact
          </h3>
          {proof.uploadedAt && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--color-text-faint)",
              }}
            >
              {new Date(proof.uploadedAt).toLocaleDateString("en-IN")}
            </span>
          )}
        </div>

        {/* Validation Status Badges */}
        <div
          style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
        >
          {/* AI Validation */}
          {proof.aiValidation && (
            <div
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "600",
                background: `${getValidationColor(proof.aiValidation.status)}20`,
                color: getValidationColor(proof.aiValidation.status),
                border: `1px solid ${getValidationColor(proof.aiValidation.status)}`,
              }}
            >
              🤖 AI: {proof.aiValidation.status}
              {proof.aiValidation.confidence && (
                <span style={{ marginLeft: "4px", opacity: 0.8 }}>
                  ({Math.round(proof.aiValidation.confidence * 100)}%)
                </span>
              )}
            </div>
          )}

          {/* Manual Review */}
          {proof.manualReview && (
            <div
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "10px",
                fontWeight: "600",
                background: `${getValidationColor(proof.manualReview.status)}20`,
                color: getValidationColor(proof.manualReview.status),
                border: `1px solid ${getValidationColor(proof.manualReview.status)}`,
              }}
            >
              👤 Manual: {proof.manualReview.status}
            </div>
          )}
        </div>
      </div>

      {/* File Viewer */}
      {!compact && files.length > 0 && (
        <div style={{ position: "relative" }}>
          {/* File Display */}
          <div
            style={{
              background: "#000",
              minHeight: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {getFileType(selectedFile) === "image" && !imageError ? (
              <LazyImage
                src={selectedFile.url}
                alt={selectedFile.description || "Proof image"}
                onError={() => setImageError(true)}
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                }}
              />
            ) : getFileType(selectedFile) === "video" ? (
              <video
                src={selectedFile.url}
                controls
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                }}
              >
                Your browser does not support video playback.
              </video>
            ) : getFileType(selectedFile) === "pdf" ? (
              <div
                style={{
                  padding: "var(--space-6)",
                  textAlign: "center",
                  color: "white",
                }}
              >
                <div
                  style={{ fontSize: "48px", marginBottom: "var(--space-3)" }}
                >
                  📄
                </div>
                <div style={{ marginBottom: "var(--space-3)" }}>
                  PDF Document
                </div>
                <a
                  href={selectedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Open PDF
                </a>
              </div>
            ) : (
              <div
                style={{
                  padding: "var(--space-6)",
                  textAlign: "center",
                  color: "white",
                }}
              >
                <div
                  style={{ fontSize: "48px", marginBottom: "var(--space-3)" }}
                >
                  📎
                </div>
                <div style={{ marginBottom: "var(--space-3)" }}>
                  {imageError
                    ? "Failed to load image"
                    : "File preview not available"}
                </div>
                <a
                  href={selectedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Download File
                </a>
              </div>
            )}
          </div>

          {/* File Navigation */}
          {files.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "var(--space-3)",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "var(--space-2)",
                background: "rgba(0,0,0,0.7)",
                padding: "8px 12px",
                borderRadius: "20px",
              }}
            >
              {files.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedFileIndex(idx);
                    setImageError(false);
                  }}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    border: "none",
                    background:
                      idx === selectedFileIndex
                        ? "white"
                        : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  aria-label={`View file ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof Details */}
      <div style={{ padding: "var(--space-3)" }}>
        {/* File Description */}
        {selectedFile?.description && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-3)",
              lineHeight: "1.5",
            }}
          >
            {selectedFile.description}
          </div>
        )}

        {/* Location Data */}
        {proof.location && (
          <div
            style={{
              padding: "10px 12px",
              background: "var(--color-surface-alt)",
              borderRadius: "var(--radius)",
              fontSize: "11px",
              marginBottom: "var(--space-3)",
            }}
          >
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              📍 Location
            </div>
            <div style={{ color: "var(--color-text-muted)" }}>
              {proof.location.address ||
                `${proof.location.city || ""}, ${proof.location.state || ""}`}
            </div>
            {proof.location.coordinates && (
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--color-text-faint)",
                  marginTop: "2px",
                  fontFamily: "monospace",
                }}
              >
                {proof.location.coordinates.lat?.toFixed(6)},{" "}
                {proof.location.coordinates.lng?.toFixed(6)}
              </div>
            )}
          </div>
        )}

        {/* AI Validation Details */}
        {proof.aiValidation?.details && !compact && (
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(168,85,247,0.08)",
              borderRadius: "var(--radius)",
              fontSize: "11px",
              marginBottom: "var(--space-3)",
              borderLeft: "3px solid #5B3D8A",
            }}
          >
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              🤖 AI Analysis
            </div>
            <div
              style={{ color: "var(--color-text-muted)", lineHeight: "1.5" }}
            >
              {proof.aiValidation.details}
            </div>
            {proof.aiValidation.flags &&
              proof.aiValidation.flags.length > 0 && (
                <div style={{ marginTop: "6px" }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-faint)",
                      marginBottom: "4px",
                    }}
                  >
                    Detected:
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                  >
                    {proof.aiValidation.flags.map((flag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "2px 6px",
                          background: "rgba(168,85,247,0.15)",
                          borderRadius: "3px",
                          fontSize: "10px",
                        }}
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Manual Review Details */}
        {proof.manualReview?.comments && !compact && (
          <div
            style={{
              padding: "10px 12px",
              background: "var(--color-surface-alt)",
              borderRadius: "var(--radius)",
              fontSize: "11px",
              borderLeft: "3px solid var(--color-primary)",
            }}
          >
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              👤 Reviewer Comments
            </div>
            <div
              style={{ color: "var(--color-text-muted)", lineHeight: "1.5" }}
            >
              {proof.manualReview.comments}
            </div>
            {proof.manualReview.reviewedBy && (
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--color-text-faint)",
                  marginTop: "6px",
                }}
              >
                Reviewed by: {proof.manualReview.reviewedBy} on{" "}
                {new Date(proof.manualReview.reviewedAt).toLocaleDateString(
                  "en-IN",
                )}
              </div>
            )}
          </div>
        )}

        {/* File Count */}
        {files.length > 1 && (
          <div
            style={{
              textAlign: "center",
              fontSize: "10px",
              color: "var(--color-text-faint)",
              marginTop: "var(--space-2)",
            }}
          >
            File {selectedFileIndex + 1} of {files.length}
          </div>
        )}
      </div>
    </div>
  );
}

ProofViewer.propTypes = {
  proof: PropTypes.shape({
    _id: PropTypes.string,
    files: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        type: PropTypes.string,
        description: PropTypes.string,
      }),
    ),
    uploadedAt: PropTypes.string,
    location: PropTypes.shape({
      address: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
    }),
    aiValidation: PropTypes.shape({
      status: PropTypes.string,
      confidence: PropTypes.number,
      details: PropTypes.string,
      flags: PropTypes.arrayOf(PropTypes.string),
    }),
    manualReview: PropTypes.shape({
      status: PropTypes.string,
      comments: PropTypes.string,
      reviewedBy: PropTypes.string,
      reviewedAt: PropTypes.string,
    }),
  }),
  compact: PropTypes.bool,
};

ProofViewer.defaultProps = {
  proof: null,
  compact: false,
};
