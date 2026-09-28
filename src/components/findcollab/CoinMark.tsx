import React from "react";

/** Gold coin mark used wherever credits are shown. */
export const CoinMark: React.FC<{ size?: number; className?: string }> = ({ size = 26, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`block shrink-0 ${className}`}
  >
    <circle cx="12" cy="12" r="10" className="fill-warning" />
    <circle cx="12" cy="12" r="9" className="fill-warning/70" />
    <circle cx="12" cy="12" r="7" className="fill-warning-light" />
    <path
      d="M12 7.7l1.32 2.68 2.96.43-2.14 2.09.5 2.95L12 14.2l-2.64 1.65.5-2.95-2.14-2.09 2.96-.43z"
      className="fill-warning"
    />
  </svg>
);

export default CoinMark;
