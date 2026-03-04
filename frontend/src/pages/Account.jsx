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
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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

const normalizePhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

const normalizeAddressForCompare = (address) => ({
  fullName: String(address?.fullName || "").trim(),
  phone: normalizePhone(address?.phone || ""),
  addressLine1: String(address?.addressLine1 || "").trim(),
  addressLine2: String(address?.addressLine2 || "").trim(),
  landmark: String(address?.landmark || "").trim(),
  city: String(address?.city || "").trim(),
  state: String(address?.state || "").trim(),
  pincode: String(address?.pincode || "").replace(/\D/g, "").slice(0, 6),
  country: String(address?.country || "India").trim() || "India",
});

export default function Account() {
  const navigate = useNavigate();
  const { user, booting, updateUser } = useAuth();

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [originalProfile, setOriginalProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [originalAddress, setOriginalAddress] = useState(
    normalizeAddressForCompare(emptyAddress),
  );

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");

  const syncFromUser = (accountUser) => {
    const name = (accountUser?.name || "").trim();
    const email = (accountUser?.email || "").trim().toLowerCase();
    const phone = normalizePhone(accountUser?.phone || "");

    setProfile({
      name,
      email,
      phone,
    });
    setOriginalProfile({ name, email, phone });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    const normalizedAddress = normalizeAddressForCompare(
      withAddressDefaults(accountUser?.shippingAddress),
    );
    setAddress(normalizedAddress);
    setOriginalAddress(normalizedAddress);
  };

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

  useEffect(() => {
    if (!booting && !user) navigate("/login");
  }, [booting, user, navigate]);

  useEffect(() => {
    if (!booting && user) syncFromUser(user);
  }, [booting, user]);

  useEffect(() => {
    if (!booting && user?._id) loadAccount();
  }, [booting, user?._id]);

  const normalizedName = profile.name.trim();
  const normalizedEmail = profile.email.trim().toLowerCase();
  const normalizedPhone = normalizePhone(profile.phone);
  const passwordChangeRequested =
    newPassword.trim().length > 0 || confirmNewPassword.trim().length > 0;
  const isNameChanged = normalizedName !== originalProfile.name;
  const isEmailChanged = normalizedEmail !== originalProfile.email;
  const isPhoneChanged = normalizedPhone !== originalProfile.phone;
  const hasProfileChanges =
    isNameChanged || isEmailChanged || isPhoneChanged || passwordChangeRequested;
  const hasAddressChanges =
    JSON.stringify(normalizeAddressForCompare(address)) !==
    JSON.stringify(originalAddress);

  const onProfileSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = profile.name.trim();
    const trimmedPhone = normalizePhone(profile.phone);
    const trimmedEmail = profile.email.trim().toLowerCase();
    const passwordForReAuth = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmNewPassword = confirmNewPassword.trim();

    const nameChanged = trimmedName !== originalProfile.name;
    const emailChanged = trimmedEmail !== originalProfile.email;
    const phoneChanged = trimmedPhone !== originalProfile.phone;
    const passwordUpdateRequested =
      trimmedNewPassword.length > 0 || trimmedConfirmNewPassword.length > 0;
    const changed =
      nameChanged || emailChanged || phoneChanged || passwordUpdateRequested;

    if (!changed) {
      setProfileError("No changes to save");
      return;
    }

    if (!trimmedName) {
      setProfileError("Name is required");
      return;
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setProfileError("Phone must be a valid Indian mobile number");
      return;
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setProfileError("Please enter a valid email address");
      return;
    }

    if (passwordUpdateRequested) {
      if (!trimmedNewPassword || !trimmedConfirmNewPassword) {
        setProfileError("New password and confirm new password are required");
        return;
      }
      if (trimmedNewPassword !== trimmedConfirmNewPassword) {
        setProfileError("New password and confirm new password do not match");
        return;
      }
      if (!PASSWORD_REGEX.test(trimmedNewPassword)) {
        setProfileError(
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
        );
        return;
      }
    }

    if (!passwordForReAuth) {
      setProfileError("Current password is required to save changes");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError("");
      setProfileSuccess("");

      const payload = {
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        currentPassword: passwordForReAuth,
      };

      if (passwordUpdateRequested) {
        payload.newPassword = trimmedNewPassword;
        payload.confirmNewPassword = trimmedConfirmNewPassword;
      }

      const { data } = await updateMyProfile(payload);
      const updatedUser = data?.user || data;
      syncFromUser(updatedUser);
      updateUser(updatedUser);
      setProfileSuccess("Profile updated successfully");
    } catch (e) {
      setProfileError(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const onAddressSubmit = async (e) => {
    e.preventDefault();

    if (!hasAddressChanges) {
      setAddressError("No changes to save");
      return;
    }

    const normalizedAddress = normalizeAddressForCompare(address);
    const trimmedPhone = normalizedAddress.phone;
    const trimmedPincode = normalizedAddress.pincode;

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

      const payload = {
        shippingAddress: {
          fullName: normalizedAddress.fullName,
          phone: trimmedPhone,
          addressLine1: normalizedAddress.addressLine1,
          addressLine2: normalizedAddress.addressLine2,
          landmark: normalizedAddress.landmark,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          pincode: trimmedPincode,
          country: normalizedAddress.country,
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
              <form onSubmit={onProfileSubmit} noValidate>
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
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        phone: normalizePhone(e.target.value),
                      }))
                    }
                    placeholder="10-digit mobile"
                  />
                </div>

                <hr className="my-4" />
                <h6 className="mb-3">Change Password</h6>

                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank if not changing"
                    autoComplete="new-password"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                </div>

                {hasProfileChanges && (
                  <div className="border rounded p-3 bg-light mb-3">
                    <h6 className="mb-2">Security Check</h6>
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                    />
                    <small className="text-secondary">
                      Required to save any profile or password change.
                    </small>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={profileSaving || !hasProfileChanges}
                  className="btn btn-primary"
                >
                  {profileSaving ? "Saving..." : "Save Changes"}
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
              <form onSubmit={onAddressSubmit} noValidate>
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
                      type="tel"
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          phone: normalizePhone(e.target.value),
                        }))
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
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
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
                  disabled={addressSaving || !hasAddressChanges}
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
