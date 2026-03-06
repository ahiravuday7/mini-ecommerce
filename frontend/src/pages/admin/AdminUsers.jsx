import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import Pagination from "../../components/Pagination";
import {
  deleteAdminUser,
  fetchAdminUsers,
  setAdminUserBlockStatus,
} from "../../api/admin.users.api";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const PAGE_SIZE = 25;

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

const statusBadgeClass = (isBlocked) =>
  isBlocked
    ? "bg-danger-subtle text-danger-emphasis"
    : "bg-success-subtle text-success-emphasis";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: null,
  });

  const openConfirmDialog = (config) => {
    setConfirmDialog({
      show: true,
      title: config.title || "Confirm Action",
      message: config.message || "Are you sure?",
      confirmText: config.confirmText || "Confirm",
      confirmVariant: config.confirmVariant || "danger",
      onConfirm: config.onConfirm || null,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, show: false, onConfirm: null }));
  };

  const loadUsers = async (targetPage = page) => {
    try {
      setLoading(true);
      setError("");
      setMsg("");

      const { data } = await fetchAdminUsers({
        page: targetPage,
        limit: PAGE_SIZE,
        search: appliedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      });

      setUsers(data.items || []);
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch, statusFilter, roleFilter]);

  const onApplySearch = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const onClearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatusFilter("all");
    setRoleFilter("all");
    setPage(1);
  };

  const onToggleBlock = (user) => {
    const nextBlocked = !user.isBlocked;

    openConfirmDialog({
      title: nextBlocked ? "Block User" : "Unblock User",
      message: `${nextBlocked ? "Block" : "Unblock"} ${user.name || "this user"}?`,
      confirmText: nextBlocked ? "Block" : "Unblock",
      confirmVariant: nextBlocked ? "warning" : "success",
      onConfirm: async () => {
        closeConfirmDialog();

        try {
          setMsg("");
          setError("");
          const { data } = await setAdminUserBlockStatus(user._id, nextBlocked);
          setMsg(data?.message || "User status updated");
          await loadUsers(page);
        } catch (e) {
          setError(e?.response?.data?.message || "Failed to update user status");
        }
      },
    });
  };

  const onDeleteUser = (user) => {
    openConfirmDialog({
      title: "Delete User",
      message: `Delete ${user.name || "this user"} permanently? This action cannot be undone.`,
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        closeConfirmDialog();

        try {
          setMsg("");
          setError("");
          const { data } = await deleteAdminUser(user._id);
          setMsg(data?.message || "User deleted");
          await loadUsers(page);
        } catch (e) {
          setError(e?.response?.data?.message || "Failed to delete user");
        }
      },
    });
  };

  return (
    <div className="py-2">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="mb-1">Users</h2>
          <p className="text-secondary mb-0">
            Search, filter, and manage user accounts.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => loadUsers(page)}
        >
          Refresh
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form className="row g-2 align-items-end" onSubmit={onApplySearch}>
            <div className="col-md-4">
              <label className="form-label mb-1">Search Users</label>
              <input
                type="text"
                className="form-control"
                placeholder="Name, email, phone"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Role</label>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="col-md-2 d-grid gap-2">
              <button type="submit" className="btn btn-primary">
                Apply
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClearFilters}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {msg && (
        <div className="alert alert-success py-2" role="alert">
          {msg}
        </div>
      )}
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h5 className="mb-0">User List</h5>
            <small className="text-secondary">Total: {total}</small>
          </div>

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-secondary py-2">
              <div className="spinner-border spinner-border-sm" role="status" />
              <span>Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <p className="text-secondary mb-0">No users found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-end">Orders</th>
                    <th className="text-end">Spent</th>
                    <th>Joined</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="fw-semibold">{u.name || "-"}</div>
                        <div className="small text-secondary">
                          {u.email || "-"}
                        </div>
                        <div className="small text-secondary">
                          {u.phone || "-"}
                        </div>
                      </td>
                      <td>{u.isAdmin ? "Admin" : "User"}</td>
                      <td>
                        <span
                          className={`badge ${statusBadgeClass(u.isBlocked)}`}
                        >
                          {u.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="text-end">{u.totalOrders || 0}</td>
                      <td className="text-end">
                        {INR.format(Number(u.totalSpent || 0))}
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => navigate(`/admin/users/${u._id}`)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              u.isBlocked
                                ? "btn-outline-success"
                                : "btn-outline-warning"
                            }`}
                            onClick={() => onToggleBlock(u)}
                            disabled={u.isAdmin}
                            title={
                              u.isAdmin
                                ? "Admin accounts cannot be blocked"
                                : ""
                            }
                          >
                            {u.isBlocked ? "Unblock" : "Block"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onDeleteUser(u)}
                            disabled={u.isAdmin}
                            title={
                              u.isAdmin
                                ? "Admin accounts cannot be deleted"
                                : ""
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Pagination
          currentPage={page}
          totalPages={pages}
          onPageChange={loadUsers}
        />
      </div>

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        disableConfirm={!confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        onConfirm={() => confirmDialog.onConfirm?.()}
      />
    </div>
  );
}
