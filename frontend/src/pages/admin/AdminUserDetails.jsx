import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteAdminUser,
  fetchAdminUserDetails,
  fetchAdminUserOrders,
  setAdminUserBlockStatus,
} from "../../api/admin.users.api";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toTitle = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPages, setOrdersPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [msg, setMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const loadDetails = async () => {
    try {
      setDetailsLoading(true);
      setDetailsError("");
      const { data } = await fetchAdminUserDetails(id);
      setUser(data.user || null);
      setStats(data.stats || null);
    } catch (e) {
      setDetailsError(e?.response?.data?.message || "Failed to load user details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const loadOrders = async (targetPage = 1) => {
    try {
      setOrdersLoading(true);
      setOrdersError("");
      const { data } = await fetchAdminUserOrders(id, {
        page: targetPage,
        limit: 8,
      });
      setOrders(data.items || []);
      setOrdersPage(data.page || 1);
      setOrdersPages(data.pages || 1);
    } catch (e) {
      setOrdersError(e?.response?.data?.message || "Failed to load user orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onToggleBlock = async () => {
    if (!user) return;
    const nextBlocked = !user.isBlocked;
    const confirmed = window.confirm(
      `${nextBlocked ? "Block" : "Unblock"} ${user.name || "this user"}?`,
    );
    if (!confirmed) return;

    try {
      setMsg("");
      setActionError("");
      const { data } = await setAdminUserBlockStatus(user._id, nextBlocked);
      setMsg(data?.message || "User status updated");
      await loadDetails();
    } catch (e) {
      setActionError(e?.response?.data?.message || "Failed to update user status");
    }
  };

  const onDeleteUser = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      `Delete ${user.name || "this user"} permanently? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setMsg("");
      setActionError("");
      const { data } = await deleteAdminUser(user._id);
      setMsg(data?.message || "User deleted");
      setTimeout(() => navigate("/admin/users"), 500);
    } catch (e) {
      setActionError(e?.response?.data?.message || "Failed to delete user");
    }
  };

  const statusText = useMemo(() => {
    if (!user) return "-";
    return user.isBlocked ? "Blocked" : "Active";
  }, [user]);

  if (detailsLoading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex align-items-center gap-2 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" />
          <span>Loading user details...</span>
        </div>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className="alert alert-danger mb-0" role="alert">
        {detailsError}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="alert alert-warning mb-0" role="alert">
        User not found.
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <div className="mb-1">
            <Link to="/admin/users" className="text-decoration-none small">
              <i className="bi bi-arrow-left me-1" />
              Back to Users
            </Link>
          </div>
          <h2 className="mb-1">{user.name || "User Details"}</h2>
          <p className="text-secondary mb-0">
            Complete profile, account controls, and order history.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={loadDetails}>
            Refresh Profile
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => loadOrders(ordersPage)}>
            Refresh Orders
          </button>
        </div>
      </div>

      {msg && (
        <div className="alert alert-success py-2" role="alert">
          {msg}
        </div>
      )}
      {actionError && (
        <div className="alert alert-danger py-2" role="alert">
          {actionError}
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Profile</h5>
              <div><b>Name:</b> {user.name || "-"}</div>
              <div><b>Email:</b> {user.email || "-"}</div>
              <div><b>Phone:</b> {user.phone || "-"}</div>
              <div><b>Role:</b> {user.isAdmin ? "Admin" : "User"}</div>
              <div><b>Status:</b> {statusText}</div>
              <div><b>Joined:</b> {formatDate(user.createdAt)}</div>
              <div><b>Blocked At:</b> {formatDate(user.blockedAt)}</div>
              <hr />
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    user.isBlocked ? "btn-outline-success" : "btn-outline-warning"
                  }`}
                  onClick={onToggleBlock}
                  disabled={user.isAdmin}
                  title={user.isAdmin ? "Admin accounts cannot be blocked" : ""}
                >
                  {user.isBlocked ? "Unblock User" : "Block User"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={onDeleteUser}
                  disabled={user.isAdmin}
                  title={user.isAdmin ? "Admin accounts cannot be deleted" : ""}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Order Summary</h5>
              <div><b>Total Orders:</b> {stats?.totalOrders || 0}</div>
              <div><b>Total Spent:</b> {INR.format(Number(stats?.totalSpent || 0))}</div>
              <div><b>Last Order:</b> {formatDate(stats?.lastOrderAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Order History</h5>

          {ordersError && (
            <div className="alert alert-danger py-2" role="alert">
              {ordersError}
            </div>
          )}

          {ordersLoading ? (
            <div className="d-flex align-items-center gap-2 text-secondary py-2">
              <div className="spinner-border spinner-border-sm" role="status" />
              <span>Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-secondary mb-0">No orders for this user.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-2">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th className="text-end">Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.invoiceNumber || order._id}</td>
                      <td className="text-capitalize">{toTitle(order.status)}</td>
                      <td className="text-capitalize">{toTitle(order.paymentStatus)}</td>
                      <td className="text-end">
                        {INR.format(Number(order.totalPrice || 0))}
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ordersPages > 1 && (
            <div className="d-flex justify-content-end align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={ordersPage <= 1}
                onClick={() => loadOrders(ordersPage - 1)}
              >
                Previous
              </button>
              <span className="small text-secondary">
                Page {ordersPage} of {ordersPages}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={ordersPage >= ordersPages}
                onClick={() => loadOrders(ordersPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
