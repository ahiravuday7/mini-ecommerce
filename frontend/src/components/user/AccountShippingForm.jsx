import { useEffect, useState } from "react";
import { updateMyShippingAddress } from "../../api/account.api";

const PHONE_REGEX = /^[6-9]\d{9}$/;

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
  pincode: String(address?.pincode || "")
    .replace(/\D/g, "")
    .slice(0, 6),
  country: "India",
});

export default function AccountShippingForm({ accountUser, onAccountUpdated }) {
  const [address, setAddress] = useState(emptyAddress);
  const [originalAddress, setOriginalAddress] = useState(
    normalizeAddressForCompare(emptyAddress),
  );
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");

  const [pincodeLookupLoading, setPincodeLookupLoading] = useState(false);
  const [pincodeLookupError, setPincodeLookupError] = useState("");
  const [lastLookedUpPincode, setLastLookedUpPincode] = useState("");

  useEffect(() => {
    const normalizedAddress = normalizeAddressForCompare(
      withAddressDefaults(accountUser?.shippingAddress),
    );
    setAddress(normalizedAddress);
    setOriginalAddress(normalizedAddress);
    setLastLookedUpPincode(
      normalizedAddress.pincode.length === 6 ? normalizedAddress.pincode : "",
    );
    setPincodeLookupError("");
    setAddressError("");
  }, [accountUser]);

  const hasAddressChanges =
    JSON.stringify(normalizeAddressForCompare(address)) !==
    JSON.stringify(originalAddress);

  const fetchAddressFromPincode = async (pincode) => {
    try {
      setPincodeLookupLoading(true);
      setPincodeLookupError("");

      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await res.json();
      const status = data?.[0]?.Status;
      const postOffice = data?.[0]?.PostOffice?.[0];

      if (!res.ok || status !== "Success" || !postOffice) {
        setPincodeLookupError("Invalid pincode");
        return;
      }

      const city = String(
        postOffice?.District || postOffice?.Block || postOffice?.Name || "",
      ).trim();
      const state = String(postOffice?.State || "").trim();

      setAddress((prev) => {
        if (prev.pincode !== pincode) return prev;
        return {
          ...prev,
          city,
          state,
          country: "India",
        };
      });
      setLastLookedUpPincode(pincode);
    } catch {
      setPincodeLookupError("Pincode lookup failed");
    } finally {
      setPincodeLookupLoading(false);
    }
  };

  const onSubmit = async (e) => {
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
    if (pincodeLookupLoading) {
      setAddressError("Please wait, fetching city and state");
      return;
    }
    if (trimmedPincode && pincodeLookupError) {
      setAddressError(pincodeLookupError);
      return;
    }
    if (trimmedPincode && (!normalizedAddress.city || !normalizedAddress.state)) {
      setAddressError("City and state are required for a valid pincode");
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
          country: "India",
        },
      };

      const { data } = await updateMyShippingAddress(payload);
      const updatedUser = data?.user || data;
      onAccountUpdated(updatedUser);
      setAddressSuccess("Shipping address updated successfully");
    } catch (err) {
      setAddressError(
        err?.response?.data?.message || "Failed to update shipping address",
      );
    } finally {
      setAddressSaving(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h5 className="mb-3">Shipping Address</h5>
        {addressError && <div className="alert alert-danger">{addressError}</div>}
        {addressSuccess && (
          <div className="alert alert-success">{addressSuccess}</div>
        )}
        <form onSubmit={onSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                value={address.fullName}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, fullName: e.target.value }))
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
                  setAddress((prev) => ({
                    ...prev,
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
                  setAddress((prev) => ({
                    ...prev,
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
                  setAddress((prev) => ({
                    ...prev,
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
                  setAddress((prev) => ({ ...prev, landmark: e.target.value }))
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
                onChange={(e) => {
                  const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setAddress((prev) => ({
                    ...prev,
                    pincode: pin,
                    ...(pin.length < 6
                      ? { city: "", state: "", country: "India" }
                      : {}),
                  }));
                  setPincodeLookupError("");
                  if (pin.length < 6) {
                    setLastLookedUpPincode("");
                  }
                  if (pin.length === 6 && pin !== lastLookedUpPincode) {
                    fetchAddressFromPincode(pin);
                  }
                }}
                placeholder="6-digit pincode"
              />
              {pincodeLookupLoading && (
                <small className="text-secondary">Fetching location...</small>
              )}
              {!pincodeLookupLoading && pincodeLookupError && (
                <small className="text-danger">{pincodeLookupError}</small>
              )}
            </div>

            <div className="col-6">
              <label className="form-label">State</label>
              <input className="form-control" value={address.state} readOnly />
            </div>

            <div className="col-6">
              <label className="form-label">City</label>
              <input className="form-control" value={address.city} readOnly />
            </div>

            <div className="col-6">
              <label className="form-label">Country</label>
              <input className="form-control" value={address.country} readOnly />
            </div>
          </div>

          <button
            type="submit"
            disabled={addressSaving || pincodeLookupLoading || !hasAddressChanges}
            className="btn btn-primary mt-3"
          >
            {addressSaving ? "Saving..." : "Update Address"}
          </button>
        </form>
      </div>
    </div>
  );
}
