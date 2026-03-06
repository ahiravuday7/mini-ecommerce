import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteMyAccount, getMyAccount } from "../../api/account.api";
import ConfirmDialog from "../../components/ConfirmDialog";
import AccountProfileForm from "../../components/user/AccountProfileForm";
import AccountShippingForm from "../../components/user/AccountShippingForm";
import { useAuth } from "../../context/AuthContext";

export default function Account() {
  const navigate = useNavigate();
  const { user, booting, updateUser } = useAuth();

  const [accountUser, setAccountUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  // delete ac
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadAccount = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const { data } = await getMyAccount();
      setAccountUser(data?.user || data);
    } catch (e) {
      setLoadError(e?.response?.data?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountUpdated = (nextUser) => {
    setAccountUser(nextUser);
    updateUser(nextUser);
  };

  useEffect(() => {
    if (!booting && !user) navigate("/login");
  }, [booting, user, navigate]);

  useEffect(() => {
    if (!booting && user) {
      setAccountUser(user);
    }
  }, [booting, user]);

  useEffect(() => {
    if (!booting && user?._id) {
      loadAccount();
    }
  }, [booting, user?._id]);

  // open confirmation dialog for account deletion
  const onDeleteAccount = () => {
    const password = deletePassword.trim();
    if (!password) {
      setDeleteError("Please enter your current password");
      return;
    }

    setDeleteError("");
    setShowDeleteDialog(true);
  };

  // confirmed account deletion
  const onConfirmDeleteAccount = async () => {
    const password = deletePassword.trim();
    if (!password) {
      setDeleteError("Please enter your current password");
      setShowDeleteDialog(false);
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");
      await deleteMyAccount({ currentPassword: password });
      setShowDeleteDialog(false);
      setAccountUser(null);
      updateUser(null);
      navigate("/login", { replace: true });
    } catch (e) {
      setDeleteError(e?.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (booting || loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex align-items-center gap-2 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" />
          <span>Loading account...</span>
        </div>
      </div>
    );
  }

  if (!user || !accountUser) return null;

  return (
    <div className="py-2">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-1">My Account</h2>
          <p className="text-secondary mb-0">
            Manage your profile and shipping details.
          </p>
        </div>
        <Link to="/orders" className="btn btn-outline-primary btn-sm">
          View My Orders
        </Link>
      </div>

      {loadError && <div className="alert alert-danger">{loadError}</div>}

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <AccountProfileForm
            accountUser={accountUser}
            onAccountUpdated={handleAccountUpdated}
          />
        </div>
        <div className="col-12 col-lg-6">
          <AccountShippingForm
            accountUser={accountUser}
            onAccountUpdated={handleAccountUpdated}
          />
        </div>
        <div className="col-12">
          <div className="card border-danger-subtle shadow-sm">
            <div className="card-body">
              <h5 className="text-danger mb-1">Delete Account</h5>
              <p className="text-secondary mb-3">
                Enter your current password to permanently delete your account.
              </p>
              {deleteError && (
                <div className="alert alert-danger">{deleteError}</div>
              )}
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-6">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
                <div className="col-12 col-md-auto">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={onDeleteAccount}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        show={showDeleteDialog}
        title="Confirm Account Deletion"
        message="Delete your account permanently? This action cannot be undone."
        confirmText="Delete Account"
        confirmVariant="danger"
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) setShowDeleteDialog(false);
        }}
        onConfirm={onConfirmDeleteAccount}
      />
    </div>
  );
}
