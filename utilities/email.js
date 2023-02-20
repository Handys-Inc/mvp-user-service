require("dotenv").config();
const {createVerificationLink} = require("../utilities/createVerification");

const SEND_GRID_API_KEY = process.env.SEND_GRID_KEY
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SEND_GRID_API_KEY);


function sendWelcomeEmail ({name, email}) {

    const msg = {
        to: email,
        from: 'sylvia@handys.ca',
        subject: `Welcome to Handys, ${name}`,
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

async function sendVerificationEmail (email, authCode) {

    const verificationLink = createVerificationLink(email)

    const link = verificationLink.resetLink;


    const msg = {
        to: email,
        //from: 'admin@handys.ca',
        from: 'sylvia@handys.ca',
        subject: 'Handys Email Verification Code',
        html: `<p>We would like to verify your account. Please enter this four digit code in the application - ${authCode}. </p>`
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

module.exports.sendWelcomeEmail = sendWelcomeEmail;
module.exports.sendVerificationEmail = sendVerificationEmail;

  

  
