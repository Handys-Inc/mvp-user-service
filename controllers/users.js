const express = require("express");
const router = express.Router();
const { User } = require("../models/user");


const _ = require("lodash");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");


const { createUser, sendNewTokens, generateVerificationToken, generateLoginToken, generateResetToken, createResetLink, updateUserPassword } = require("../utilities/userAuthentication");
const { getUser } = require("../utilities/users");
const { sendVerificationEmail } = require('../utilities/email');
const { sendVerificationText } = require('../utilities/sms');
const { generateAuthCode } = require('../utilities/createVerification');
const { validateEmail, validateNumber, validateUser } = require('../utilities/userValidation');


let verificationToken = '';
let textVerificationToken = '';

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
    // const {error} = validateUser(req.body);
    // if (error) return res.status(400).send(error.details[0].message);


    const { firstName, lastName, email, password, token} = req.body;

    let user = await User.findOne({ verificationToken: token });

    if (!user) {
        return res.status(400).json({ message: 'Invalid verification token' });
    }

    let updatedUser = await createUser(user, {firstName, lastName, password});

    // if(user) {
    //     //await sendNewTokens(user);
    //     //send email
    //     sendWelcomeEmail({name: user.firstName + " " + user.lastName, email: user.email},);
    // }
    
    return res.status(200)
            .send(_.pick(updatedUser, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel"]));
    };

exports.userLogin =  async (req, res, next) => {
    //check email exists
    let user = null;
    if (req.body.email) user = await User.findOne({$and: [{email: req.body.email.toLowerCase(), status: "active"}]});
    if (!user) return res.status(404).send("The provided email does not belong to any Handys account.");


    const validPassword = await bcryptjs.compare(
        req.body.password,
        user.password
    );
    if (!validPassword) return res.status(400).send("The password provided is incorrect.");

    if(user.status !== 'active') return res.status(401).send("This account is inactive");

    //last login
    await User.findByIdAndUpdate(user._id, {
        $set: {
            'lastLogin': new Date()
        }
    });

    const token = await generateLoginToken(user);
    return res.header("x-auth-token", token).status(200).send(token);
    
};

exports.getUserAccount = async (req, res, next) => {
    const user = req.user._id;
    let isValid = mongoose.Types.ObjectId.isValid(user);
    if (!isValid) return res.status(400).send("Invalid user id");

    const userDetails = await getUser(req.params.id);

    return res.status(200).send(_.pick(userDetails, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel", "status"]))
};

exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    const {error} = await validateEmail(email);

    if (error) return res.status(400).send(error.details[0].message);

    let user = null;
    if (email) {
        user = await User.findOne({$and: [{email: req.body.email.toLowerCase(), status:"active"}]});
        if (!user) return res.status(404).send("The provided email does not belong to any Handys account.");
    }

    const token = await generateResetToken(user);

    //update user with password change token
    let updateUserPasswordToken = await User.updateOne({$and: [{_id: user._id}]}, {
        $set: {
            passwordChangeToken: token
        }
    });

    const resetLink = await createResetLink(token);

    //sendPasswordResetEmail(email, resetLink);
    
    return res.status(200).json({
        "message":"You will receive an email if the email address entered exists in our systems",
        "resetToken": token
    });
}

exports.resetPassword = async (req, res, next) => {
    const user = await User.findOne({$and: [{passwordChangeToken: req.body.passwordResetToken, status:"active"}]});

    if (!user) return res.status(404).send("Password change not found");

    let userId = user._id.toString();

    await updateUserPassword(userId, req.body.password);

    //remove password change token
    let updatedPassword = await User.updateOne({$and: [{_id: userId}]}, {
        $set: {
            passwordChangeToken: null
        }
    });

    return res.status(200).send("Password reset was successful");
}

exports.updateUserPassword = async (req, res, next) => {
    try {
        if (!req.params.id) return res.status(400).send("Invalid user id");

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User account not found.");
        if (!await bcryptjs.compare(req.body.currentPassword, user.password)) return res.status(400).send("Current password is incorrect.");

        const updatedUser = await updateUserPassword(req.params.id, req.body.newPassword);
        return res.status(200).send("Password update was successful");
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

exports.updateUserNumber = async (req, res, next) => {
    try {
        if (!req.params.id) return res.status(400).send("Invalid user id");
        if (!req.body.phoneNumber || req.body.phoneNumber.length < 1) return res.status(400).send("Phone Number is required.");

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User account not found.");

        const numberCheck = await User.findOne({phoneNumber: req.body.phoneNumber});
        if (numberCheck && numberCheck._id.toString() !== req.params.id) return res.status(400).send("The provided number already belongs to another account.");

        const updatedNumber = await User.updateOne({_id: req.params.id}, {
            phoneNumber: req.body.phoneNumber
        }, {new: true});


        return res.status(200).send({
            message: 'Phone numuber update was successful',
            data: _.pick(userDetails, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel", "status"])
        })
    } catch (error) {
        return res.status(500).send(error.message)
    }
}


exports.updateUserEmail = async (req, res, next) => {
    try {
        if (!req.params.id) return res.status(400).send("Invalid user id");
        if (!req.body.email || req.body.email.length < 1) return res.status(400).send("Email is required.");

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User account not found.");

        const emailCheck = await User.findOne({email: req.body.email});
        if (emailCheck && emailCheck._id.toString() !== req.params.id) return res.status(400).send("The provided email already belongs to another account.");

        const updatedUser = await User.updateOne({_id: req.params.id}, {
            email: req.body.email.toLowerCase()
        }, {new: true});

        const userDetails = await getUser(req.params.id);

        return res.status(200).send({
            message: 'Email update was successful',
            data: _.pick(userDetails, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel", "status"])
        })
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

exports.deactivateAccount = async (req, res, next) => {
    try {
        if (!req.params.id) return res.status(400).send("Invalid user id");

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User account not found.");

        // const activeCheck = await User.findOne({$and: [{_id: req.params.id, status: "active"}]});
        // if (!activeCheck) return res.status(400).send("The accpunt is inactive");

        const updatedUser = await User.updateOne({_id: req.params.id}, {
            $set: {
                status: "inactive"
            }
        });

        return res.status(200).send('Account deactivated');
    } catch (error) {
        return res.status(500).send(error.message)
    }
}
