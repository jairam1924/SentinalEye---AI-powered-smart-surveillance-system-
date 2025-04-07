const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const settingsController = require('../controllers/settingsController');

router.get('/', ensureAuthenticated, settingsController.getSettingsPage);


module.exports = router;
