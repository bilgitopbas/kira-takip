"use client";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
        aria-label="Önceki sayfa"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
              p === page
                ? "bg-[#17B6AE] text-white"
                : "text-slate-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
        aria-label="Sonraki sayfa"
      >
        ›
      </button>
    </div>
  );
}
