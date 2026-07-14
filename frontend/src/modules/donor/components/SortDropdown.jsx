import React, { useState, useRef, useEffect } from "react";

/**
 * SortDropdown Component
 * Provides sorting options for campaign discovery with clear labels and descriptions
 */
const SortDropdown = ({
  currentSort = "recent",
  onSortChange,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sort options with user-friendly labels and descriptions
  const sortOptions = [
    {
      value: "recent",
      label: "Most Recent",
      description: "Newest campaigns first",
      icon: "🕒",
    },
    {
      value: "highest_trust",
      label: "Highest Trust Score",
      description: "Most trusted campaigns first",
      icon: "🛡️",
    },
    {
      value: "most_funded",
      label: "Most Funded",
      description: "Highest donation amounts first",
      icon: "💰",
    },
    {
      value: "ending_soon",
      label: "Ending Soon",
      description: "Campaigns ending soonest first",
      icon: "⏰",
    },
    {
      value: "funding_progress_desc",
      label: "Highest Progress",
      description: "Closest to funding goal first",
      icon: "📊",
    },
    {
      value: "transparency_desc",
      label: "Most Transparent",
      description: "Highest transparency scores first",
      icon: "👁️",
    },
    {
      value: "recommended",
      label: "Recommended for You",
      description: "Personalized recommendations",
      icon: "⭐",
    },
  ];

  // Get current sort option
  const currentOption =
    sortOptions.find((option) => option.value === currentSort) ||
    sortOptions[0];

  // Handle sort selection
  const handleSortSelect = (sortValue) => {
    onSortChange?.(sortValue);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Sort Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-[var(--color-ink)] 
          bg-white border border-[var(--color-steel)] rounded-md shadow-sm hover:bg-[var(--color-paper-alt)] 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-signal)]
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <span className="text-base">{currentOption.icon}</span>
          <div className="text-left">
            <div className="font-medium">{currentOption.label}</div>
            <div className="text-xs text-[var(--color-steel)]">
              {currentOption.description}
            </div>
          </div>
        </div>

        <svg
          className={`ml-2 h-5 w-5 text-[var(--color-steel)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortSelect(option.value)}
              className={`
                w-full text-left px-4 py-3 hover:bg-[var(--color-paper-alt)] focus:bg-[var(--color-paper-alt)] focus:outline-none
                ${currentSort === option.value ? "bg-[var(--color-signal-light)] text-[var(--color-signal-dark)]" : "text-[var(--color-ink)]"}
              `}
              role="option"
              aria-selected={currentSort === option.value}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      currentSort === option.value
                        ? "text-[var(--color-signal-dark)]"
                        : "text-[var(--color-ink)]"
                    }`}
                  >
                    {option.label}
                  </div>
                  <div
                    className={`text-sm ${
                      currentSort === option.value
                        ? "text-[var(--color-signal-dark)]"
                        : "text-[var(--color-steel)]"
                    }`}
                  >
                    {option.description}
                  </div>
                </div>
                {currentSort === option.value && (
                  <svg
                    className="h-5 w-5 text-[var(--color-signal)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Screen reader only label */}
      <label htmlFor="sort-dropdown" className="sr-only">
        Sort campaigns by
      </label>
    </div>
  );
};

export default SortDropdown;
