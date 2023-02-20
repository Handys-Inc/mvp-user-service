const express = require("express");

const userController = require('../controllers/users');

const router = express.Router();

router.post("/verify-email", userController.verifyEmail);
router.post("/verify-number", userController.verifyNumber);
router.post("/signup", userController.userSignup);
router.post("/login", userController.userLogin);
//router.post("/create-existing-user", userController.createExistingUser);

module.exports = router;