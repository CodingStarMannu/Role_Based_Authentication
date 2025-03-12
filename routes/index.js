const express = require('express');
const router = express.Router();
const roleRoutes = require('./roleRoutes');
const userRoutes = require('./userRoutes');

router.use('/roles', roleRoutes);
router.use('/users', userRoutes);

module.exports = router;