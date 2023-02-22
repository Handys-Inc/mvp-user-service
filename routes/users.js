const express = require("express");

const userController = require('../controllers/users');
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/verify-email", userController.verifyEmail);
router.post("/verify-number", userController.verifyNumber);
router.post("/signup", userController.userSignup);
router.post("/login", userController.userLogin);
router.get("/user/:id", auth, userController.getUserAccount);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", auth, userController.resetPassword);
router.post("/reset-password/:id", auth, userController.updateUserPassword);
router.post("/update-email/:id", auth, userController.updateUserEmail);
router.post("/update-number/:id", auth, userController.updateUserNumber);

module.exports = router;