const jwt = require("jsonwebtoken");
var db = require("../models/index");
const { User, Role } = db;
require('dotenv').config();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["name"],
          },
        ],
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.status === "blocked") {
        return res.status(403).json({ error: "Account is blocked" });
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleId: user.roleId,
        parentId: user.parentId,
        status: user.status,
      };

      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Server error during authentication" });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superAdmin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. SuperAdmin role required." });
  }
};

const isAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "superAdmin")
  ) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin role required." });
  }
};

const canManageUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // SuperAdmin can manage all users
    if (currentUser.role === "superAdmin") {
      return next();
    }

    const targetUser = await User.findByPk(userId);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if current user is the creator (parent) of the target user
    if (targetUser.parentId === currentUser.id) {
      return next();
    }

    // Check if the target user is a child or descendant of the current user
    let isDescendant = false;
    let parentId = targetUser.parentId;

    while (parentId) {
      if (parentId === currentUser.id) {
        isDescendant = true;
        break;
      }

      const parent = await User.findByPk(parentId);
      if (!parent) break;

      parentId = parent.parentId;
    }

    if (isDescendant) {
      return next();
    }

    return res
      .status(403)
      .json({
        error: "Access denied. You do not have permission to manage this user.",
      });
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ error: "Server error during authorization" });
  }
};

module.exports = {
  authenticate,
  isSuperAdmin,
  isAdmin,
  canManageUser,
};
