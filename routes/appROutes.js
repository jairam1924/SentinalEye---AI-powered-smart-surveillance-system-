const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');

router.get('/', ensureAuthenticated, appController.renderIndex);
router.get('/aiapp', ensureAuthenticated, appController.getAIApp);
router.post('/process-video', ensureAuthenticated, appController.processVideo);

module.exports = router;
