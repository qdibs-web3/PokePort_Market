// pokemon-frontend/src/components/explore/SeriesGrid.jsx
import React from 'react';

export default function SeriesGrid({ series = [], loading = false, onSeriesClick, selected }) {
  if (loading) {
    return <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading series…</div>;
  }

  if (!series || series.length === 0) {
    return <div className="py-10 text-center text-gray-500 dark:text-gray-400">No series found.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
      {series.map((s) => {
        // Check if this series is selected by comparing IDs
        const isSelected = selected && selected.id === s.id;
        
        return (
          <button
            key={s.id || s.name}
            onClick={() => onSeriesClick(s)}
            className={`flex flex-col items-center p-3 rounded-md border transition-all duration-200 hover:shadow-lg text-left ${
              isSelected
                ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 shadow-md transform scale-105'
                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600'
            }`}
          >
            {/* Only display the name and release date */}
            <div className={`text-sm font-medium ${
              isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'
            }`}>{s.name}</div>
            <div className={`text-xs ${
              isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
            }`}>{s.releaseDate ?? ''}</div>
          </button>
        );
      })}
    </div>
  );
}
