import { useEffect, useState } from "react";
import { updateMyProfile } from "../api/account.api";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const normalizePhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

export default function AccountProfileForm({ accountUser, onAccountUpdated }) {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [originalProfile, setOriginalProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  useEffect(() => {
    const name = (accountUser?.name || "").trim();
    const email = (accountUser?.email || "").trim().toLowerCase();
    const phone = normalizePhone(accountUser?.phone || "");

    setProfile({ name, email, phone });
    setOriginalProfile({ name, email, phone });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setProfileError("");
  }, [accountUser]);

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

  const onSubmit = async (e) => {
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
      onAccountUpdated(updatedUser);
      setProfileSuccess("Profile updated successfully");
    } catch (err) {
      setProfileError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h5 className="mb-3">Profile Details</h5>
        {profileError && <div className="alert alert-danger">{profileError}</div>}
        {profileSuccess && (
          <div className="alert alert-success">{profileSuccess}</div>
        )}
        <form onSubmit={onSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
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
                setProfile((prev) => ({ ...prev, email: e.target.value }))
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
                setProfile((prev) => ({
                  ...prev,
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
  );
}
