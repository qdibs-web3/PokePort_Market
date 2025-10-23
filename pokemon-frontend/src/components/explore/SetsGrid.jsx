// src/components/explore/SetsGrid.jsx

const SetsGrid = ({ sets = [], selectedSet, onSetClick }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
      {sets.length === 0 ? (
        <div className="col-span-full text-center text-gray-500">
          No sets available
        </div>
      ) : (
        sets.map((set) => {
          const logoUrl = set.logo ? `${set.logo}.png` : null;

          return (
            <button
              key={set.id || set.code || set.name}
              onClick={() => onSetClick(set)}
              className={`p-3 rounded-md border bg-white/5 flex flex-col items-center hover:shadow-md ${
                selectedSet && selectedSet.id === set.id ? 'ring-2 ring-indigo-400' : ''
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
                <div className="w-28 h-20 flex items-center justify-center bg-white/10 rounded mb-2 text-sm">
                  {set.name}
                </div>
              )}

              <div className="text-sm font-medium text-center">{set.name}</div>
              <div className="text-xs text-gray-400">{set.releaseDate ?? ''}</div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default SetsGrid;
