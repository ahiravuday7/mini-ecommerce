const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Checks if value is a string,If yes -> removes spaces from start and end,If not -> returns the value unchanged
const trimIfString = (value) =>
  typeof value === "string" ? value.trim() : value;

// Checks if value is a string, If not -> returns it unchanged,If yes:removes spaces,converts to lowercase
const normalizeEmail = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().toLowerCase();
};

// Filter and format user data before sending it to frontend
const mapUserAccount = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  shippingAddress: user.shippingAddress,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
});

// GET /api/account ,This API returns logged-in user’s account details
const getMyAccount = asyncHandler(async (req, res) => {
  // Get user from database, excludes password field
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ user: mapUserAccount(user) });
});

// PUT /api/account/profile
// body: { name?, email?, phone?, currentPassword?, newPassword?, confirmNewPassword? }
const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Checks if at least one field is present in request
  const hasUpdateField = [
    "name",
    "email",
    "phone",
    "newPassword",
    "confirmNewPassword",
  ].some(
    (field) => req.body[field] !== undefined,
  );

  // If no field:
  if (!hasUpdateField) {
    res.status(400);
    throw new Error("At least one profile field is required");
  }

  const incomingName =
    req.body.name !== undefined ? trimIfString(req.body.name) : undefined;
  const incomingEmail =
    req.body.email !== undefined ? normalizeEmail(req.body.email) : undefined;
  const incomingPhone =
    req.body.phone !== undefined ? trimIfString(req.body.phone) : undefined;
  const incomingNewPassword =
    req.body.newPassword !== undefined ? trimIfString(req.body.newPassword) : undefined;
  const incomingConfirmNewPassword =
    req.body.confirmNewPassword !== undefined
      ? trimIfString(req.body.confirmNewPassword)
      : undefined;
  const passwordChangeRequested =
    req.body.newPassword !== undefined || req.body.confirmNewPassword !== undefined;

  const currentName = trimIfString(user.name || "");
  const currentEmail = normalizeEmail(user.email || "");
  const currentPhone = trimIfString(user.phone || "");

  const nameWillChange =
    req.body.name !== undefined && (incomingName || "") !== currentName;
  const emailWillChange =
    req.body.email !== undefined && (incomingEmail || "") !== currentEmail;
  const phoneWillChange =
    req.body.phone !== undefined && (incomingPhone || "") !== currentPhone;

  if (passwordChangeRequested) {
    if (!incomingNewPassword || !incomingConfirmNewPassword) {
      res.status(400);
      throw new Error("New password and confirm new password are required");
    }
    if (incomingNewPassword !== incomingConfirmNewPassword) {
      res.status(400);
      throw new Error("New password and confirm new password do not match");
    }
    if (!PASSWORD_REGEX.test(incomingNewPassword)) {
      res.status(400);
      throw new Error(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      );
    }
  }

  // Sensitive updates require re-authentication
  if (nameWillChange || emailWillChange || phoneWillChange || passwordChangeRequested) {
    const currentPassword = trimIfString(req.body.currentPassword);
    if (!currentPassword) {
      res.status(400);
      throw new Error("Current password is required to save changes");
    }

    const isValidPassword = await user.matchPassword(currentPassword);
    if (!isValidPassword) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }
  }

  // Update name , Validate name
  if (req.body.name !== undefined) {
    const name = trimIfString(req.body.name);
    if (!name) {
      res.status(400);
      throw new Error("Name cannot be empty");
    }
    user.name = name;
  }

  // Update email
  if (req.body.email !== undefined) {
    const email = incomingEmail; //Trims + converts to lowercase

    // Case 1: Empty email
    if (!email) {
      user.email = undefined;
    } else {
      if (!EMAIL_REGEX.test(email)) {
        res.status(400);
        throw new Error("Invalid email format");
      }

      // Case 2: same email exists,but not this user
      const emailExists = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      // If duplicate:
      if (emailExists) {
        res.status(400);
        throw new Error("User with this email already exists");
      }
      // Assign email
      user.email = email;
    }
  }

  // Update phone
  if (req.body.phone !== undefined) {
    const phone = incomingPhone;

    // Case 1: Empty phone
    if (!phone) {
      user.phone = undefined;
    } else {
      if (!PHONE_REGEX.test(phone)) {
        res.status(400);
        throw new Error("Invalid phone format");
      }

      // Case 2: Check duplicate
      const phoneExists = await User.findOne({
        phone,
        _id: { $ne: user._id },
      });
      // If duplicate:
      if (phoneExists) {
        res.status(400);
        throw new Error("User with this phone already exists");
      }
      //Assign phone
      user.phone = phone;
    }
  }

  // User must have at least one contact method
  if (!user.email && !user.phone) {
    res.status(400);
    throw new Error("At least one of email or phone is required");
  }

  if (passwordChangeRequested) {
    user.password = incomingNewPassword;
  }

  // Save to database
  const updatedUser = await user.save();

  // Formats user using mapper,Sends clean response
  res.json({ user: mapUserAccount(updatedUser) });
});

// PUT /api/account/shipping-address
// body: { shippingAddress: {...} } or direct address fields
const updateMyShippingAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id); //Fetch the logged-in user

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  //If req.body.shippingAddress exists and it’s an object -> use that object,Otherwise -> treat req.body itself as the address object
  const addressInput =
    req.body.shippingAddress && typeof req.body.shippingAddress === "object"
      ? req.body.shippingAddress
      : req.body;

  // validation (checking at least one field is provided),updating only these fields (ignore everything else)
  const addressFields = [
    "fullName",
    "phone",
    "addressLine1",
    "addressLine2",
    "landmark",
    "city",
    "state",
    "pincode",
  ];

  // Validate: at least one address field must be provided
  // .some() returns true if any one of those fields exists in addressInput.
  const hasAddressField = addressFields.some(
    (field) => addressInput[field] !== undefined,
  );

  if (!hasAddressField) {
    res.status(400);
    throw new Error("At least one shipping address field is required");
  }

  // If user already has a shipping address, you copy it into a plain object.If not, you start with an empty object.
  const existingAddress = user.shippingAddress
    ? user.shippingAddress.toObject()
    : {};

  // Update only provided fields (merge + trim)
  addressFields.forEach((field) => {
    // If the field is present in request (even if empty string), you update that one,Before saving, you run trimIfString() to remove extra spaces for string inputs
    if (addressInput[field] !== undefined) {
      existingAddress[field] = trimIfString(addressInput[field]);
    }
  });

  // Country is fixed for this project.
  existingAddress.country = "India";

  if (existingAddress.phone && !PHONE_REGEX.test(existingAddress.phone)) {
    res.status(400);
    throw new Error("Invalid shipping phone format");
  }

  user.shippingAddress = existingAddress;
  const updatedUser = await user.save();

  res.json({ user: mapUserAccount(updatedUser) });
});

module.exports = {
  getMyAccount,
  updateMyProfile,
  updateMyShippingAddress,
};
