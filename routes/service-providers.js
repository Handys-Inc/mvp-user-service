const express = require("express");
require("dotenv").config();

const serviceProviderController = require('../controllers/service-providers');
const auth = require("../middleware/auth");

const { storage } = require("../config/cloudinary");

const router = express.Router();
const multer = require('multer');

const upload = multer({
    storage: storage
})

//Onboarding
router.post("/onboarding/legal-agreement", auth, serviceProviderController.legalConsent);
router.post("/onboarding/job-profile", auth, serviceProviderController.jobProfile);
router.post("/onboarding/upload-profile-picture", auth, upload.single('profilePicture'), serviceProviderController.uploadProfilePicture);
router.post("/upload-id-card", auth, upload.array('images'), serviceProviderController.uploadIDCard);
router.post("/upload-completed-jobs", auth, upload.array('images'), serviceProviderController.uploadCompletedJobs);
router.post("/upload-insurance", auth, upload.array('images'), serviceProviderController.uploadInsurance);
router.post("/finish-setup", auth, serviceProviderController.finishSetup);


module.exports = router;