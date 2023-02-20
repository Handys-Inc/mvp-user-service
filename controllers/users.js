const express = require("express");
const router = express.Router();
const { User } = require("../models/user");


const _ = require("lodash");
const bcryptjs = require("bcryptjs");


const { createUser, sendNewTokens } = require("../utilities/userAuthentication");
const {sendVerificationEmail} = require('../utilities/email');
const {generateAuthCode} = require('../utilities/createVerification');
const {validateEmail} = require('../utilities/userValidation');


exports.verifyEmail = async (req, res, next) => {
    console.log(req.body);
    const { userEmail } = req.body;

    const {error} = await validateEmail(userEmail);

    if (error) return res.status(400).send(error.details[0].message);

        const authCode = await generateAuthCode();
    
        //send email
        await sendVerificationEmail(userEmail, authCode);

        return res
        .status(200)
        .send({userEmail, authCode});

};

exports.sendVerification =  async (req, res, next) => {
    console.log("works")
};


//create user
exports.createUser =  async (req, res) => {
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({email: req.body.email});
    if (user) return res.status(400).send("User already registered.");

    let user_exists = false;
    if(!user_exists) {
        user = await createUser(req.body);

        if(user) {
            await sendNewTokens(user);
        }

        //send email
        sendWelcomeEmail({name: user.firstName + " " + user.lastName, email: user.email},);

        return res
            .status(200)
            .send(_pick(user, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel"]));
    }
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

exports.createExistingUser =  async (req, res, next) => {
    let user = await User.findOne({email: req.body.email});
    if (user) return res.status(400).send("user already registered");

    user = await createExistingUser(req.body);
    return res.status(200).send(user);
};

async function createUserEmailToken(body){
    try {
        let email = body.email;
        const userExists = await User.findOne({email: email});
        if(userExists) {

        }
        
    } catch (error) {
        
    }
};