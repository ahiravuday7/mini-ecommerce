import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyAccount } from "../../api/account.api";
import AccountProfileForm from "../../components/user/AccountProfileForm";
import AccountShippingForm from "../../components/user/AccountShippingForm";
import { useAuth } from "../../context/AuthContext";

export default function Account() {
  const navigate = useNavigate();
  const { user, booting, updateUser } = useAuth();

  const [accountUser, setAccountUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
      </div>
    </div>
  );
}
