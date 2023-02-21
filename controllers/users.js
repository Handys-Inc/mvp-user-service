const express = require("express");
const router = express.Router();
const { User } = require("../models/user");


const _ = require("lodash");
const bcryptjs = require("bcryptjs");


const { createUser, sendNewTokens, generateVerificationToken } = require("../utilities/userAuthentication");
const { sendVerificationEmail } = require('../utilities/email');
const { sendVerificationText } = require('../utilities/sms');
const { generateAuthCode } = require('../utilities/createVerification');
const { validateEmail, validateNumber, validateUser } = require('../utilities/userValidation');


const verificationToken = '';
const textVerificationToken = '';

exports.verifyEmail = async (req, res, next) => {
    const { email } = req.body;
    const {error} = await validateEmail(email);

    if (error) return res.status(400).send(error.details[0].message);

        const authCode = await generateAuthCode();

        verificationToken = await generateVerificationToken(email)
    
        //send email
        //await sendVerificationEmail(email, authCode);

        //add token to db with email address
        const user = await User.findOneAndUpdate(
            { email: email },
            { verificationToken: verificationToken },
            { upsert: true, new: true }
          );

        return res.status(200).send({email, authCode});

};

exports.verifyNumber = async (req, res, next) => {
    const { phoneNumber } = req.body;
    // const {error} = await validateNumber(phoneNumber);

    // if (error) return res.status(400).send(error.details[0].message);

        const authCode = await generateAuthCode();

        //const token = await generateVerificationToken(email)
    
        //send sms
        //await sendVerificationText(phoneNumber, authCode);

        //add token to db with phone number
        const user = await User.findOneAndUpdate(
            { phoneNumber: phoneNumber },
            { verificationToken: authCode },
            { upsert: true, new: true }
          );

        return res.status(200).send({phoneNumber, authCode});

};


//create user
exports.userSignup =  async (req, res) => {
    const {error} = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);


    const { firstName, lastName, email, password, token} = req.body;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
        return res.status(400).json({ message: 'Invalid verification token' });
    }
    
    user = await createUser(req.body);

    if(user) {
        await sendNewTokens(user);
        //send email
        sendWelcomeEmail({name: user.firstName + " " + user.lastName, email: user.email},);
    }
    
    return res.status(200)
            .send(_pick(user, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel"]));
    };

exports.userLogin =  async (req, res, next) => {
    //check email exists
    let user = null;
    if (req.body.email) user = await User.findOne({email: req.body.email.toLowerCase()});
    if (!user) return res.status(404).send("The provided email does not belong to any Handys account.");


    const validPassword = await bcryptjs.compare(
        req.body.password,
        user.password
    );
    if (!validPassword) return res.status(400).send("The password provided is incorrect.");
};
