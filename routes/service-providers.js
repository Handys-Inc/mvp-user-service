const express = require("express");

const serviceProviderController = require('../controllers/service-providers');
const auth = require("../middleware/auth");

const router = express.Router();

//Onboarding
router.post("/onboarding/job-profile", serviceProviderController.jobProfile);


module.exports = router;