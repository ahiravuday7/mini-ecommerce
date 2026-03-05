import { Link } from "react-router-dom";

const tiles = [
  {
    title: "Dashboard",
    desc: "Analytics and business insights",
    to: "/admin/dashboard",
    icon: "bi-speedometer2",
    btnClass: "btn-outline-primary",
  },
  {
    title: "Products",
    desc: "Create, edit, and manage inventory",
    to: "/admin/products",
    icon: "bi-box-seam",
    btnClass: "btn-outline-primary",
  },
  {
    title: "FAQs",
    desc: "Manage customer help content",
    to: "/admin/faqs",
    icon: "bi-patch-question",
    btnClass: "btn-outline-primary",
  },
  {
    title: "Users",
    desc: "Manage users, account status, and order history",
    to: "/admin/users",
    icon: "bi-people",
    btnClass: "btn-outline-primary",
  },
];

export default function AdminHome() {
  return (
    <div className="py-2">
      <div className="mb-4">
        <h2 className="mb-1">Admin Home</h2>
        <p className="text-secondary mb-0">Choose where you want to go.</p>
      </div>

      <div className="row g-3">
        {tiles.map((tile) => (
          <div className="col-md-6 col-xl-4" key={tile.to}>
            <Link to={tile.to} className="text-decoration-none text-dark">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0">{tile.title}</h5>
                    <i className={`bi ${tile.icon} fs-4 text-secondary`} />
                  </div>

                  <p className="text-secondary mb-4">{tile.desc}</p>

                  <div className="mt-auto">
                    <span className={`btn btn-sm ${tile.btnClass}`}>
                      Open {tile.title}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
