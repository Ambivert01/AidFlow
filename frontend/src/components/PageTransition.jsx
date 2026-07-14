import { useLocation } from "react-router-dom";

// Wraps routed page content so every navigation in the app gets a
// consistent, lightweight entrance instead of an instant hard-cut. Keying
// on pathname forces React to remount the wrapper (and replay the CSS
// animation) on every route change, without touching the 80+ individual
// page components or their own internal state/animations.
export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
}
