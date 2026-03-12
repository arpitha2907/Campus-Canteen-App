const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // get token from request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "❌ No token, access denied" });
    }

    // extract the token (remove "Bearer " prefix)
    const token = authHeader.split(" ")[1];

    // verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach user info to the request
    req.user = decoded;

    next(); // move to the next step
  } catch (error) {
    return res.status(401).json({ message: "❌ Invalid token" });
  }
};

// admin only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "❌ Admin access only" });
  }
};

module.exports = { protect, adminOnly };