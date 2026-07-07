"use client";

import { useState } from "react";

export default function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hovered || value) >= n;
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${n} yildiz`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-7 h-7 transition-colors ${
                filled ? "fill-amber-400 stroke-amber-400" : "fill-transparent stroke-gray-300"
              }`}
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27l-5.8 3.1 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
              />
            </svg>
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-xs text-slate-400">{value}/5</span>
      )}
    </div>
  );
}
