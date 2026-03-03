import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/products.api";

export default function ProductSearchBar({
  className = "w-100",
  maxWidth = 420,
  placeholder = "Search products",
  resultsPath = "/products",
  redirectOnEmpty = "/",
}) {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const searchBoxRef = useRef(null);

  // Search Submit
  const onSearch = (e) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) {
      navigate(redirectOnEmpty);
      return;
    }
    navigate(`${resultsPath}?q=${encodeURIComponent(q)}`);
    setShowSuggestions(false);
  };

  // Debounced API Call / Wait before API call,Avoids spam requests (250ms)
  useEffect(() => {
    const q = searchText.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionLoading(false);
      return;
    }

    // If effect is outdated -> ignore response
    let cancelled = false;
    // setTimeout -> Delayed Execution (Debounce)
    const timer = setTimeout(async () => {
      try {
        setSuggestionLoading(true);
        const { data } = await fetchProducts({ q }); // So inside this delayed function, call APIs cleanly.Sends query to backend
        if (cancelled) return;

        setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []); //Takes only first 6 items/If data is not valid:Clear suggestions
        setShowSuggestions(true);
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (!cancelled) setSuggestionLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText]);

  // User clicks anywhere outside,Dropdown should close automatically
  useEffect(() => {
    const onClickOutside = (event) => {
      if (!searchBoxRef.current?.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // User clicked suggestion -> show it, close dropdown, and take them to product.
  const onSuggestionClick = (product) => {
    setSearchText(product.title || "");
    setShowSuggestions(false);
    navigate(`/product/${product._id}`);
  };

  // This function handles the “See all results” click—basically moving the user from quick suggestions -> full search results page.
  const onShowAllResults = () => {
    const q = searchText.trim();
    if (!q) {
      navigate(redirectOnEmpty);
      return;
    }
    setShowSuggestions(false);
    navigate(`${resultsPath}?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      onSubmit={onSearch}
      className={className}
      style={{ maxWidth }}
      ref={searchBoxRef}
    >
      <div className="position-relative">
        <div className="input-group input-group-sm">
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={searchText}
            onFocus={() => setShowSuggestions(Boolean(searchText.trim()))}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-primary">
            Search
          </button>
        </div>

        {showSuggestions && (
          <div
            className="position-absolute start-0 end-0 bg-white border rounded shadow-sm mt-1"
            style={{ zIndex: 1050 }}
          >
            {suggestionLoading ? (
              <div className="px-3 py-2 text-secondary small">Searching...</div>
            ) : suggestions.length > 0 ? (
              <>
                {suggestions.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="btn btn-link text-start w-100 px-3 py-2 text-decoration-none border-bottom"
                    onClick={() => onSuggestionClick(item)}
                  >
                    <div className="fw-semibold text-dark">{item.title}</div>
                    <div className="small text-secondary">
                      {item.brand ? `${item.brand} - ` : ""}
                      {`\u20B9${item.price}`}
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-link text-start w-100 px-3 py-2 text-decoration-none"
                  onClick={onShowAllResults}
                >
                  See all results for "{searchText.trim()}"
                </button>
              </>
            ) : (
              <div className="px-3 py-2 text-secondary small">
                No suggestions found
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
