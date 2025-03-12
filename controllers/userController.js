var db = require("../models/index");
const { User, Role } = db;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
require('dotenv').config();

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide name, email and password" });
    }

    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const role = await Role.findByPk(roleId);

    if (!role) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (
      role.name === "superAdmin" &&
      (!req.user || req.user.role !== "superAdmin")
    ) {
      return res
        .status(403)
        .json({ error: "Only SuperAdmin can create another SuperAdmin" });
    }

    if (
      role.name === "admin" &&
      (!req.user ||
        (req.user.role !== "superAdmin" && req.user.role !== "admin"))
    ) {
      return res
        .status(403)
        .json({ error: "Only SuperAdmin or Admin can create an Admin" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      roleId,
      parentId: req.user ? req.user.id : null,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role.name,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Server error while registering user" });
  }
};

// User login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["name"],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res
        .status(403)
        .json({
          error:
            "Your account has been blocked. Please contact the administrator.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

// Get all users (with filtering based on role)
const getUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    let whereCondition = {};

    // If not a superAdmin, only show users created by the current user
    if (currentUser.role !== "superAdmin") {
      // Find all child users (directly or indirectly)
      const findAllChildUserIds = async (userId) => {
        const directChildren = await User.findAll({
          where: { parentId: userId },
          attributes: ["id"],
        });

        const childIds = directChildren.map((child) => child.id);

        // Recursively find all descendants
        for (const childId of [...childIds]) {
          const descendants = await findAllChildUserIds(childId);
          childIds.push(...descendants);
        }

        return childIds;
      };

      const childUserIds = await findAllChildUserIds(currentUser.id);

      whereCondition.id = {
        [Op.in]: childUserIds,
      };
    }

    const users = await User.findAll({
      where: whereCondition,
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["name"],
        },
        {
          model: User,
          as: "parent",
          attributes: ["id", "name", "email"],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ? user.role.name : null,
        status: user.status,
        parent: user.parent
          ? {
              id: user.parent.id,
              name: user.parent.name,
              email: user.parent.email,
            }
          : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error while fetching users" });
  }
};

// Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["name"],
        },
        {
          model: User,
          as: "parent",
          attributes: ["id", "name", "email"],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ? user.role.name : null,
        status: user.status,
        parent: user.parent
          ? {
              id: user.parent.id,
              name: user.parent.name,
              email: user.parent.email,
            }
          : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error while fetching user" });
  }
};

// Update user status (block/unblock)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !["active", "blocked"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Valid status (active/blocked) is required" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${
        status === "blocked" ? "blocked" : "activated"
      } successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Server error while updating user status" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUserStatus,
};
