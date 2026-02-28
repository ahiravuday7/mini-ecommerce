export default function UserHamburgerMenu() {
  const menuId = "userMenuOffcanvas";

  return (
    <>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        data-bs-toggle="offcanvas"
        data-bs-target={`#${menuId}`}
        aria-controls={menuId}
        aria-label="Open menu"
      >
        <i className="bi bi-list fs-5" />
      </button>

      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id={menuId}
        aria-labelledby="userMenuOffcanvasLabel"
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title" id="userMenuOffcanvasLabel">
            Menu
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          {/* Add menu content here later */}
        </div>
      </div>
    </>
  );
}
