const express = require("express");
const router = express.Router();
const QrController = require("../controllers/QrController");
const { authTokenMiddleWare } = require("../middleware/authMiddleware");

router.get('/generate', QrController.generateQr);
router.post('/confirm', authTokenMiddleWare, QrController.confirmQr);

module.exports = router;
