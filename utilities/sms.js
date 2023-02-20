require("dotenv").config();

async function sendVerificationText(phoneNumber, authCode) {
    console.log("text sent");
};

module.exports.sendVerificationText = sendVerificationText;