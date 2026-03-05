const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.cookies.jwt) {
    token = req.cookies.jwt;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");
      //checks whether the current logged-in user is authorized and not blocked before allowing them to access the API.
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
      }
      if (req.user.isBlocked) {
        res.cookie("jwt", "", {
          httpOnly: true,
          expires: new Date(0),
        });
        return res
          .status(403)
          .json({
            message: "Your account is blocked. Please contact support.",
          });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized" });
    }
  } else {
    res.status(401).json({ message: "No token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) next();
  else res.status(403).json({ message: "Admin access only" });
};

module.exports = { protect, admin };
