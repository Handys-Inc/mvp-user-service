require("dotenv").config();
const {createVerificationLink} = require("../utilities/createVerification");

const SEND_GRID_API_KEY = process.env.SEND_GRID_API_KEY
//SEND_GRID_KEY
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SEND_GRID_API_KEY);


async function sendWelcomeEmail ({name, email}) {
    const msg = {
        to: email,
        from: 'work@handys.ca',
        subject: `Welcome to Handys, ${name}`,
        html: '<p>To welcome you to Handys</p>',
      };

      try {
        const response = await sgMail.send(msg);
        //console.log('Email sent successfully');
        console.log('Email sent successfully with message ID:', response[0].messageId);
        return response[0].messageId;
      } catch (error) {
        console.error(error);
      }
};

async function sendVerificationEmail (email, authCode) {
    // const verificationLink = await createVerificationLink(email)
    // const link = verificationLink.resetLink;
    const msg = {
        to: email,
        from: 'work@handys.ca',
        subject: 'Handys Email Verification Code',
        html: `<p>We would like to verify your account. Please enter this four digit code in the application - ${authCode}. </p>`
      };

      try {
        const response = await sgMail.send(msg);
        console.log('Email sent successfully with message ID:', response[0].messageId);
        return response[0].messageId;
      } catch (error) {
        console.error(error);
      }

      //return verificationLink.token;

};

async function sendPasswordResetEmail (email, resetLink) {

  const msg = {
      to: email,
      from: 'work@handys.ca',
      subject: 'Handys Password Reset',
      html: `<p>You have requested a link to reset your password. Click the link below to change your password:
      <br>
      <a target="_blank" href="${resetLink}">Reset Password</a></p>>`
    };

    // (async () => {
    //   try {
    //     await sgMail.send(msg);
    //   } catch (error) {
    //     console.error(error);
    
    //     if (error.response) {
    //       console.error(error.response.body)
    //     }
    //   }
    // })();

    try {
      const response = await sgMail.send(msg);
      console.log('Email sent successfully with message ID:', response[0].messageId);
      //return response[0].messageId;
    } catch (error) {
      console.error(error);
    }

    return verificationLink.token;

};

module.exports.sendWelcomeEmail = sendWelcomeEmail;
module.exports.sendVerificationEmail = sendVerificationEmail;
module.exports.sendPasswordResetEmail = sendPasswordResetEmail;

  

  
