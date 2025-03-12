const express = require('express');
const router = express.Router();
const { createRole, getRoles } = require('../controllers/roleController');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

// SuperAdmin can create roles
router.post('/', authenticate, isSuperAdmin, createRole);

// Get all roles
router.get('/', authenticate, getRoles);

module.exports = router;