// src/components/explore/SetsGrid.jsx

const SetsGrid = ({ sets = [], selectedSet, onSetClick }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
      {sets.length === 0 ? (
        <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
          No sets available
        </div>
      ) : (
        sets.map((set, index) => {
          const logoUrl = set.logo ? `${set.logo}.png` : null;
          // Use index as part of key to guarantee uniqueness (Japanese API has duplicate IDs)
          const uniqueKey = `${index}-${set.id}-${set.name}`;

          return (
            <button
              key={uniqueKey}
              onClick={() => onSetClick(set)}
              className={`p-3 rounded-md border bg-white dark:bg-gray-700 flex flex-col items-center hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-all ${
                selectedSet && selectedSet.id === set.id && selectedSet.name === set.name ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : 'border-gray-200 dark:border-gray-600'
              }`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${set.name} logo`}
                  className="w-28 h-24 object-contain mb-1"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${set.logo}.webp`;
                  }}
                />
              ) : (
                <div className="w-28 h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded mb-2 text-sm text-gray-700 dark:text-gray-300">
                  {set.name}
                </div>
              )}

              <div className="text-sm font-medium text-center text-gray-900 dark:text-gray-100">{set.name}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{set.releaseDate ?? ''}</div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default SetsGrid;