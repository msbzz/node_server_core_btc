const express = require('express');
const router = express.Router();

router.use('/invoice', require('./invoiceRoutes'));
router.use('/health', require('./healthRoutes'));
router.use('/wallet', require('./walletRoutes'));
router.use('/ln', require('./lnRoutes'));
router.use('/dev', require('./devRoutes'));

module.exports = router;
