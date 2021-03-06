const express = require("express");
const router = express.Router();

//import controller
const { signup, activateAccount, forgotPassword, resetPassword, signin} = require("../controllers/auth");

router.post('/signup', signup);
router.post('/email-activate', activateAccount);
router.post('/signin', signin);

router.put('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);


module.exports = router;
