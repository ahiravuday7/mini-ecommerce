import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyAccount,
  updateMyProfile,
  updateMyShippingAddress,
} from "../api/account.api";
import { useAuth } from "../context/AuthContext";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

const withAddressDefaults = (address) => ({
  ...emptyAddress,
  ...(address || {}),
});

export default function Account() {
  const navigate = useNavigate();
  const { user, booting, updateUser } = useAuth();

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState(emptyAddress);

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const syncFromUser = (accountUser) => {
    setProfile({
      name: accountUser?.name || "",
      email: accountUser?.email || "",
      phone: accountUser?.phone || "",
    });
    setAddress(withAddressDefaults(accountUser?.shippingAddress));
  };

  const loadAccount = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getMyAccount();
      const accountUser = data?.user || data;
      syncFromUser(accountUser);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!booting && !user) navigate("/login");
  }, [booting, user, navigate]);

  useEffect(() => {
    if (!booting && user?._id) loadAccount();
  }, [booting, user?._id]);

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      };

      const { data } = await updateMyProfile(payload);
      const updatedUser = data?.user || data;
      syncFromUser(updatedUser);
      updateUser(updatedUser);
      setSuccess("Profile updated successfully");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const onAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddressSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
      };

      const { data } = await updateMyShippingAddress(payload);
      const updatedUser = data?.user || data;
      syncFromUser(updatedUser);
      updateUser(updatedUser);
      setSuccess("Shipping address updated successfully");
    } catch (e) {
      setError(
        e?.response?.data?.message || "Failed to update shipping address",
      );
    } finally {
      setAddressSaving(false);
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

  if (!user) return null;

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

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Profile Details</h5>
              <form onSubmit={onProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="your@email.com"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="9876543210"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn btn-primary"
                >
                  {profileSaving ? "Saving..." : "Update Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Shipping Address</h5>
              <form onSubmit={onAddressSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-control"
                      value={address.fullName}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, fullName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-control"
                      value={address.phone}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, phone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Address Line 1</label>
                    <input
                      className="form-control"
                      value={address.addressLine1}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          addressLine1: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Address Line 2</label>
                    <input
                      className="form-control"
                      value={address.addressLine2}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          addressLine2: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Landmark</label>
                    <input
                      className="form-control"
                      value={address.landmark}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, landmark: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={address.city}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, city: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label">State</label>
                    <input
                      className="form-control"
                      value={address.state}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, state: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label">Pincode</label>
                    <input
                      className="form-control"
                      value={address.pincode}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, pincode: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label">Country</label>
                    <input
                      className="form-control"
                      value={address.country}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, country: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={addressSaving}
                  className="btn btn-primary mt-3"
                >
                  {addressSaving ? "Saving..." : "Update Address"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
