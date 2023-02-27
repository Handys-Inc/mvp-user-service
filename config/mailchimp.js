const Mailchimp = require('mailchimp-api-v3');
require("dotenv").config();

const apiKey = process.env.MAILCHIMP_API_KEY;
const mailchimp = new Mailchimp(apiKey);

module.exports = mailchimp;