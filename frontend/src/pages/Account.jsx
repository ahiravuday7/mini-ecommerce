import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyAccount,
  updateMyProfile,
  updateMyShippingAddress,
} from "../api/account.api";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

// Default shipping address structure
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

// If backend has partial address (missing fields), this fills missing ones from emptyAddress.
const withAddressDefaults = (address) => ({
  ...emptyAddress,
  ...(address || {}),
});

export default function Account() {
  const navigate = useNavigate();
  const { user, booting, updateUser } = useAuth();

  // Profile & Address form values
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [emailLocked, setEmailLocked] = useState(false); //Can user edit email?
  const [address, setAddress] = useState(emptyAddress);

  // Loading / saving flags
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  //Errors/success messages
  const [loadError, setLoadError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");

  // get user data from:AuthContext user,OR from getMyAccount(),OR after profile/address update API,call syncFromUser() to update UI form fields.So forms always display latest data.
  const syncFromUser = (accountUser) => {
    setProfile({
      name: accountUser?.name || "",
      email: accountUser?.email || "",
      phone: accountUser?.phone || "",
    });
    // If user already has email -> lock input,If user doesn’t have email -> allow input
    setEmailLocked(Boolean(accountUser?.email));
    setAddress(withAddressDefaults(accountUser?.shippingAddress));
  };

  //fetch latest user data from backend
  const loadAccount = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const { data } = await getMyAccount();
      const accountUser = data?.user || data;
      syncFromUser(accountUser);
    } catch (e) {
      setLoadError(e?.response?.data?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!booting && !user) navigate("/login");
  }, [booting, user, navigate]);

  //Fill form immediately from AuthContext user, This gives fast UI: you don’t wait for API call.
  useEffect(() => {
    if (!booting && user) syncFromUser(user);
  }, [booting, user]);

  // Fetch fresh data from backend when user id exists
  useEffect(() => {
    if (!booting && user?._id) loadAccount();
  }, [booting, user?._id]);

  //Profile submit handler
  const onProfileSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const trimmedName = profile.name.trim();
    const trimmedPhone = profile.phone.trim();
    const trimmedEmail = profile.email.trim().toLowerCase();

    if (!trimmedName) {
      setProfileError("Name is required");
      return;
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setProfileError("Phone must be a valid Indian mobile number");
      return;
    }
    //Validation only runs when:email is editable (!emailLocked),AND user entered something
    if (!emailLocked && trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setProfileError("Please enter a valid email address");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError("");
      setProfileSuccess("");

      // API call
      const payload = {
        name: trimmedName,
        phone: trimmedPhone,
        // email locked- emailLocked = true,email not locked- emailLocked = false
        ...(!emailLocked && trimmedEmail ? { email: trimmedEmail } : {}),
      };

      const { data } = await updateMyProfile(payload);
      const updatedUser = data?.user || data;
      syncFromUser(updatedUser); //update local form state via syncFromUser
      updateUser(updatedUser); //update global auth user via updateUser
      setProfileSuccess("Profile updated successfully");
    } catch (e) {
      setProfileError(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // Address submit handler
  const onAddressSubmit = async (e) => {
    e.preventDefault();

    // Validation;
    const trimmedPhone = address.phone.trim();
    const trimmedPincode = address.pincode.trim();

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setAddressError("Shipping phone must be a valid Indian mobile number");
      return;
    }
    if (trimmedPincode && !/^\d{6}$/.test(trimmedPincode)) {
      setAddressError("Pincode must be 6 digits");
      return;
    }

    try {
      setAddressSaving(true);
      setAddressError("");
      setAddressSuccess("");

      // Payload shape
      const payload = {
        shippingAddress: {
          fullName: address.fullName.trim(),
          phone: trimmedPhone,
          addressLine1: address.addressLine1.trim(),
          addressLine2: address.addressLine2.trim(),
          landmark: address.landmark.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: trimmedPincode,
          country: address.country.trim() || "India",
        },
      };

      const { data } = await updateMyShippingAddress(payload);
      const updatedUser = data?.user || data;
      syncFromUser(updatedUser);
      updateUser(updatedUser);
      setAddressSuccess("Shipping address updated successfully");
    } catch (e) {
      setAddressError(
        e?.response?.data?.message || "Failed to update shipping address",
      );
    } finally {
      setAddressSaving(false);
    }
  };

  // Loading UI
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

      {loadError && <div className="alert alert-danger">{loadError}</div>}

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Profile Details</h5>
              {profileError && (
                <div className="alert alert-danger">{profileError}</div>
              )}
              {profileSuccess && (
                <div className="alert alert-success">{profileSuccess}</div>
              )}
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
                    disabled={emailLocked}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder={emailLocked ? "" : "your@email.com"}
                  />
                  <small className="text-secondary">
                    {/* Before adding → “you can add once”,After adding → “you can’t change” */}
                    {emailLocked
                      ? "Email change requires verification."
                      : "You can add email once. After saving, it becomes read-only."}
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={profile.phone}
                    inputMode="numeric"
                    pattern="^[6-9]\\d{9}$"
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="10-digit mobile"
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
              {addressError && (
                <div className="alert alert-danger">{addressError}</div>
              )}
              {addressSuccess && (
                <div className="alert alert-success">{addressSuccess}</div>
              )}
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
                      inputMode="numeric"
                      pattern="^[6-9]\\d{9}$"
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, phone: e.target.value }))
                      }
                      placeholder="10-digit mobile"
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
                      inputMode="numeric"
                      pattern="^[0-9]{6}$"
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, pincode: e.target.value }))
                      }
                      placeholder="6-digit pincode"
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
