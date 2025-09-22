// pokemon-frontend/src/components/explore/SeriesGrid.jsx
import React from 'react';

export default function SeriesGrid({ series = [], loading = false, onSeriesClick, selected }) {
  if (loading) {
    return <div className="py-10 text-center text-gray-500">Loading series…</div>;
  }

  if (!series || series.length === 0) {
    return <div className="py-10 text-center text-gray-500">No series found.</div>;
  }

  return (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {series.map((s) => (
      <button
        key={s.id || s.code || s.key || s.name}
        onClick={() => onSeriesClick(s)}
        className={`flex flex-col items-center p-3 rounded-md border transition-shadow hover:shadow-lg text-left ${
          selected && (selected.id === s.id || selected.code === s.code)
            ? 'ring-2 ring-indigo-400'
            : 'bg-white/5'
        }`}
      >
        {/* Only display the name and release date */}
        <div className="text-sm font-medium">{s.name}</div>
        <div className="text-xs text-gray-400">{s.releaseDate ?? ''}</div>
      </button>
    ))}
  </div>
);

}
