import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboard } from "../../api/admin.dashboard.api";

// formatter for Indian currency
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const NUMBER = new Intl.NumberFormat("en-IN");

// converts year + month -> readable label
const formatMonthLabel = (year, month) => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString("en-IN", { month: "short", year: "numeric" });
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //fetches dashboard data from API
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data: response } = await fetchAdminDashboard();
      setData(response);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  //Fetch data on page load
  useEffect(() => {
    load();
  }, []);

  //creates an array of dashboard cards data (Sales, Orders, Users, Stock)
  const cards = useMemo(() => {
    //It recalculates only when data changes
    // If data is null -> no crash,Default to {} if missing
    const summary = data?.summary || {};
    const inventory = data?.inventory || {};
    //Return cards array
    return [
      {
        title: "Total Sales",
        value: INR.format(Number(summary.totalSales || 0)),
        icon: "bi-currency-rupee",
      },
      {
        title: "Total Orders",
        value: NUMBER.format(Number(summary.totalOrders || 0)),
        icon: "bi-box-seam",
      },
      {
        title: "Total Users",
        value: NUMBER.format(Number(summary.totalUsers || 0)),
        icon: "bi-people",
      },
      {
        title: "Low Stock Alerts",
        value: NUMBER.format(Number(inventory.lowStockCount || 0)),
        icon: "bi-exclamation-triangle",
        sub: `<= ${inventory.threshold || 5} units`,
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex align-items-center gap-2 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mb-0" role="alert">
        {error}
      </div>
    );
  }

  const topSellingProducts = data?.topSellingProducts || [];
  const lowStockProducts = data?.inventory?.lowStockProducts || [];
  const dailyRevenue = data?.revenue?.daily || [];
  const monthlyRevenue = data?.revenue?.monthly || [];
  const inventory = data?.inventory || {};

  return (
    <div className="py-2">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="mb-1">Dashboard</h2>
          <p className="text-secondary mb-0">
            Sales, orders, users and inventory insights.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={load}
        >
          Refresh
        </button>
      </div>

      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div className="col-sm-6 col-xl-3" key={card.title}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <p className="text-secondary text-uppercase small mb-0">
                    {card.title}
                  </p>
                  <i className={`bi ${card.icon} text-secondary`} />
                </div>
                <h3 className="mb-1">{card.value}</h3>
                {card.sub && (
                  <p className="small text-secondary mb-0">{card.sub}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Top-Selling Products</h5>
                <Link
                  className="btn btn-sm btn-outline-secondary"
                  to="/admin/products"
                >
                  Manage Products
                </Link>
              </div>
              {topSellingProducts.length === 0 ? (
                <p className="text-secondary mb-0">No sales data yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-end">Units Sold</th>
                        <th className="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellingProducts.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={
                                  product.image ||
                                  "https://via.placeholder.com/64x64?text=No+Image"
                                }
                                alt={product.title}
                                width="36"
                                height="36"
                                className="rounded border object-fit-cover"
                              />
                              <span>{product.title}</span>
                            </div>
                          </td>
                          <td className="text-end">
                            {NUMBER.format(Number(product.totalQtySold || 0))}
                          </td>
                          <td className="text-end">
                            {INR.format(Number(product.totalRevenue || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Inventory Tracking</h5>
              <div className="row g-3">
                <MetricBlock
                  title="Products"
                  value={NUMBER.format(Number(inventory.totalProducts || 0))}
                />
                <MetricBlock
                  title="Units In Stock"
                  value={NUMBER.format(
                    Number(inventory.totalUnitsInStock || 0),
                  )}
                />
                <MetricBlock
                  title="Out of Stock"
                  value={NUMBER.format(Number(inventory.outOfStockCount || 0))}
                />
                <MetricBlock
                  title="Low Stock"
                  value={NUMBER.format(Number(inventory.lowStockCount || 0))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Low Stock Alerts</h5>
              {lowStockProducts.length === 0 ? (
                <p className="text-secondary mb-0">No low stock products.</p>
              ) : (
                <div className="d-grid gap-2">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product._id}
                      className="d-flex align-items-center justify-content-between border rounded px-3 py-2"
                    >
                      <div>
                        <div className="fw-semibold">{product.title}</div>
                        <div className="small text-secondary">
                          {product.brand ? `${product.brand} - ` : ""}
                          {product.category || "General"}
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          Number(product.stock || 0) === 0
                            ? "text-bg-danger"
                            : "text-bg-warning"
                        }`}
                      >
                        {NUMBER.format(Number(product.stock || 0))} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Daily Revenue</h5>
              <MiniRevenueTable rows={dailyRevenue} isMonthly={false} />
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Monthly Revenue</h5>
              <MiniRevenueTable rows={monthlyRevenue} isMonthly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBlock({ title, value }) {
  return (
    <div className="col-6">
      <div className="border rounded p-3 h-100">
        <div className="small text-secondary mb-1">{title}</div>
        <div className="fs-5 fw-semibold">{value}</div>
      </div>
    </div>
  );
}

function MiniRevenueTable({ rows, isMonthly }) {
  if (rows.length === 0) {
    return <p className="text-secondary mb-0">No revenue data.</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{isMonthly ? "Month" : "Date"}</th>
            <th className="text-end">Orders</th>
            <th className="text-end">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={isMonthly ? `${row.year}-${row.month}` : row.label}>
              <td>
                {isMonthly ? formatMonthLabel(row.year, row.month) : row.label}
              </td>
              <td className="text-end">
                {NUMBER.format(Number(row.orders || 0))}
              </td>
              <td className="text-end">
                {INR.format(Number(row.revenue || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
