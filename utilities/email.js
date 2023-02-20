require("dotenv").config();
const createVerificationLink = require("../utilities/createVerification");

const SEND_GRID_API_KEY = process.env.SEND_GRID_KEY
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SEND_GRID_API_KEY);

function sendWelcomeEmail (userData, emailConfig) {

    const msg = {
        to: userData.name,
        from: 'admin@handys.ca',
        subject: 'Welcome to Handys',
        text: 'To welcome you to Handys',
        html: '<p>To welcome you to Handys</p>',
      };

    (async () => {
        try {
          await sgMail.send(msg);
        } catch (error) {
          console.error(error);
      
          if (error.response) {
            console.error(error.response.body)
          }
        }
      })();
};

async function sendVerificationEmail (userData, authCode) {

    const verificationLink = createVerificationLink(userData.email)

    const link = verificationLink.resetLink;

    const msg = {
        to: userData,
        from: 'admin@handys.ca',
        subject: 'Verify your email',
        text: `We would like to verify your account. Please enter this four digit code in the application - ${authCode}`,
        html: `<p>We would like to verify your account. Please enter this four digit code in the application - ${authCode}. 
            Click this link to be redirected to the page ->
            <a target="_blank" href="$${link}">Verify Email</a></p>
            
        </p>`
      };

      (async () => {
        try {
          await sgMail.send(msg);
        } catch (error) {
          console.error(error);
      
          if (error.response) {
            console.error(error.response.body)
          }
        }
      })();

      return verificationLink.token;

};

module.exports = sendWelcomeEmail;
module.exports = sendVerificationEmail;

  

  
