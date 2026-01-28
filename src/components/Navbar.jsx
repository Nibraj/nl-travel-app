import { useEffect, useState } from 'react';

const nlViewbox = '-59.5,51.2,-52.2,46.5';

export default function Navbar({ onPlaceSelected }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const nlQuery = `${query}, Newfoundland and Labrador`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&bounded=1&viewbox=${nlViewbox}&q=${encodeURIComponent(nlQuery)}`
        );
        const results = await response.json();
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const nlQuery = `${query}, Newfoundland and Labrador`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=${nlViewbox}&q=${encodeURIComponent(nlQuery)}`
      );
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        onPlaceSelected({
          lat: Number(lat),
          lng: Number(lon),
          label: results[0].display_name,
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionPick = (suggestion) => {
    setQuery(suggestion.display_name);
    setSuggestions([]);
    onPlaceSelected({
      lat: Number(suggestion.lat),
      lng: Number(suggestion.lon),
      label: suggestion.display_name,
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1100] bg-white shadow-md flex items-center justify-between px-6 py-3">
      <h1 className="text-lg font-bold text-blue-700">NL Travel Map</h1>

      <div className="relative">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search Newfoundland..."
            className="w-72 px-3 py-2 border rounded shadow-sm bg-white text-sm focus:outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-60"
            disabled={isSearching}
          >
            Search
          </button>
        </form>

        {(isSuggesting || suggestions.length > 0) && (
          <div className="absolute top-12 left-0 right-0 z-[1100] rounded border bg-white shadow-lg">
            {isSuggesting && (
              <div className="px-3 py-2 text-xs text-gray-500">Searching...</div>
            )}
            {!isSuggesting && suggestions.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">No matches found.</div>
            )}
            {suggestions.map((suggestion) => (
              <button
                key={`${suggestion.place_id}`}
                type="button"
                onClick={() => handleSuggestionPick(suggestion)}
                className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50"
              >
                {suggestion.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
