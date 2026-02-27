export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = []; //store page numbers
  const start = Math.max(1, currentPage - 1); //Go 1 page before current,But never go below 1
  const end = Math.min(totalPages, currentPage + 1); //Go 1 page after current, But never exceed totalPages

  // Add first page and ‘...’ if there’s a gap before current pages
  if (start > 1) {
    pages.push(1); // Always show the first page
    if (start > 2) pages.push("ellipsis-start"); // Add "..." if there's a gap
  }

  // Add current page and its nearby pages.
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  // Add ‘...’ and last page if there’s a gap after current pages.
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("ellipsis-end"); // Add "..." if there's a gap
    pages.push(totalPages); // Always show the last page
  }

  return (
    <nav aria-label="Products pagination">
      <ul className="pagination justify-content-center mb-0">
        {/* If you are on page 1, disable the button */}
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          {/* Prevent clicking when already on first page */}
          <button
            className="page-link"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </button>
        </li>

        {/* Loop through pages */}
        {pages.map((page, index) => (
          <li
            key={`${page}-${index}`}
            className={`page-item ${
              page === "ellipsis-start" || page === "ellipsis-end"
                ? "disabled"
                : currentPage === page
                  ? "active"
                  : ""
            }`}
          >
            <button
              // Gives pagination look (spacing, border, hover)Bootstrap class
              className="page-link"
              // Button becomes disabled, User cannot click "..."
              disabled={page === "ellipsis-start" || page === "ellipsis-end"}
              onClick={() => {
                if (typeof page === "number") onPageChange(page);
              }}
            >
              {page === "ellipsis-start" || page === "ellipsis-end"
                ? "..."
                : page}
            </button>
          </li>
        ))}

        <li
          className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
        >
          <button
            className="page-link"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
