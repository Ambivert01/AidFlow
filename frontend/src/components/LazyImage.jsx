import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * LazyImage Component
 *
 * Lazy loads images using Intersection Observer API.
 * Features:
 * - Loads images only when they enter viewport
 * - Shows placeholder while loading
 * - Handles loading errors
 * - Supports responsive images
 */
export default function LazyImage({
  src,
  alt,
  placeholder,
  className,
  style,
  onLoad,
  onError,
  threshold = 0.1,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Check if Intersection Observer is supported
    if (!("IntersectionObserver" in window)) {
      // Fallback: load image immediately
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin: "50px", // Start loading 50px before entering viewport
      },
    );

    observer.observe(imgRef.current);

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div
      ref={imgRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: placeholder || "var(--color-surface-alt)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(10px)",
              }}
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--color-border)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "var(--color-surface-alt)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: "12px",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🖼️</div>
          <div>Failed to load image</div>
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        />
      )}

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  threshold: PropTypes.number,
};

LazyImage.defaultProps = {
  placeholder: null,
  className: "",
  style: {},
  onLoad: null,
  onError: null,
  threshold: 0.1,
};
