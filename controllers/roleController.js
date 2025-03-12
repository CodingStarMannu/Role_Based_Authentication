var db = require("../models/index");
const { User, Role } = db;
require('dotenv').config();

// Create a new role (SuperAdmin only)
const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Role name is required" });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });

    if (existingRole) {
      return res.status(400).json({ error: "Role already exists" });
    }

    const role = await Role.create({ name });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ error: "Server error while creating role" });
  }
};

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ["id", "name", "createdAt", "updatedAt"],
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Server error while fetching roles" });
  }
};

module.exports = {
  createRole,
  getRoles,
};
