import { Component } from "react";
import PropTypes from "prop-types";

/**
 * TimelineErrorBoundary Component
 *
 * Catches errors in timeline rendering and provides graceful fallback UI.
 * Implements React Error Boundary pattern for robust error handling.
 */
class TimelineErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Timeline Error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service (e.g., Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "var(--space-6)",
            textAlign: "center",
            background: "var(--color-surface)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "var(--space-3)" }}>
            ⚠️
          </div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "var(--space-2)",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-4)",
              maxWidth: "500px",
              margin: "0 auto var(--space-4)",
            }}
          >
            We encountered an error while loading the timeline. This might be a
            temporary issue.
          </p>

          {this.props.showDetails && this.state.error && (
            <details
              style={{
                marginBottom: "var(--space-4)",
                textAlign: "left",
                maxWidth: "600px",
                margin: "0 auto var(--space-4)",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Error Details
              </summary>
              <pre
                style={{
                  fontSize: "11px",
                  padding: "var(--space-3)",
                  background: "var(--color-surface-alt)",
                  borderRadius: "var(--radius)",
                  overflow: "auto",
                  maxHeight: "200px",
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              justifyContent: "center",
            }}
          >
            <button onClick={this.handleRetry} className="btn btn-primary">
              Try Again
            </button>
            {this.props.fallbackAction && (
              <button
                onClick={this.props.fallbackAction}
                className="btn btn-ghost"
              >
                {this.props.fallbackActionLabel || "Go Back"}
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

TimelineErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
  onRetry: PropTypes.func,
  fallbackAction: PropTypes.func,
  fallbackActionLabel: PropTypes.string,
  showDetails: PropTypes.bool,
};

TimelineErrorBoundary.defaultProps = {
  onError: null,
  onRetry: null,
  fallbackAction: null,
  fallbackActionLabel: "Go Back",
  showDetails: false,
};

export default TimelineErrorBoundary;
