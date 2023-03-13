const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const { ServiceProvider } = require("../models/service-provider");


const _ = require("lodash");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");


const { createUser, sendNewTokens, generateVerificationToken, generateLoginToken, generateResetToken, createResetLink, updateUserPassword } = require("../utilities/userAuthentication");
const { getUser } = require("../utilities/users");
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utilities/email');
const { sendVerificationText } = require('../utilities/sms');
const { generateAuthCode } = require('../utilities/createVerification');
const { validateEmail, validateNumber, validateUser } = require('../utilities/userValidation');


async function userVerification(email) {
    const authCode = await generateAuthCode();
    verificationToken = await generateVerificationToken(email)

     //send email
    await sendVerificationEmail(email, authCode);

    //add token to db with email address
    const user = await User.findOneAndUpdate(
        { email: email },
        { verificationToken: authCode },
        { upsert: true, new: true }
      );

    return authCode;
}

exports.verifyEmail = async (req, res, next) => {
    const { email } = req.body;
    const { error } = await validateEmail(email);

    if (error) return res.status(400).send(error.details[0].message);

    let userVerified = await User.findOne({$and: [{email: email, 'verified.email': true}] });
    if (userVerified) return res.status(400).send("User email already exists and is verified");

    let userExists = await User.findOne({$and: [{email: email}] });
    if (userExists) {
        let authCode = await userVerification(email);

        return res.status(400).send({
            message: "User email already exists, but not verified. Sending an email to verify user.",
            authCode: authCode
        });
    }
    else {
        let authCode = await userVerification(email);

        return res.status(200).send({
            message: "Verification email sent",
            authCode: authCode
        });
    }
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

        return res.status(200).send({
            message: "Verification message sent",
            authCode: authCode
        });

};

exports.verifyCode = async (req, res, next) => {
    const { verificationToken } = req.body;

    const isValid = await User.findOne({ verificationToken: verificationToken });

    if (!isValid) {
        return res.status(400).json({ message: 'Invalid verification token' });
    }
    else {
        const isVerified = await User.updateOne({$and: [{_id: isValid._id}]}, {
            $set: {
                'verified.email' : true
            }
        });

        return res.json({
            message: "Token verified"
        });
    }
}

//create user
exports.userSignup =  async (req, res) => {
    const { firstName, lastName, email, password, userAccess} = req.body;

    let userExists = await User.findOne({$and: [{email: email}]});
    if (!userExists) {
        return res.status(400).json({ message: 'User does not exist.' });
    }

    let userVerified = await User.findOne({$and: [{email: email, 'verified.email': true}]});
    if (!userVerified) {
        return res.status(400).json({ message: 'User not verified for signup.' });
    }

    if(userVerified) {
       //send email
       await sendWelcomeEmail({name: firstName + " " + lastName, email: email},);
    }

    try {
        let updatedUser = await createUser(userVerified, {firstName, lastName, password, userAccess});

        if(updatedUser) {
            return res.status(200)
            .send(_.pick(updatedUser, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel"]));
        }
        else {
            return res.status(400).send("User signup failed");
        }  
    } catch (error) {
        console.log(error);
    }
};

exports.userLogin =  async (req, res, next) => {
    //check email exists
    let user = null;
    if (req.body.email) user = await User.findOne({$and: [{email: req.body.email.toLowerCase(), status: "active"}]});
    if (!user) return res.status(404).send("The provided email does not belong to any active Handys account.");


    const validPassword = await bcryptjs.compare(
        req.body.password,
        user.password
    );
    if (!validPassword) return res.status(400).send("The password provided is incorrect.");

    if(user.status !== 'active') return res.status(401).send("This account is inactive");

    let token = await generateLoginToken(user);
    //last login
    let updatedUser = await User.findByIdAndUpdate(user._id, {
        $set: {
            'lastLogin': new Date()
        },
    }, { new: true });

    updatedUser.token = token;

    //if user is a service provider add other details
    if (updatedUser.userAccess.includes('service')){
        //updatedUser = await User.findById(user._id).populate('user');
        updatedUser.serviceProvider = await ServiceProvider.findOne({user: updatedUser._id});
    }
    
    return res.header("x-auth-token", token)
              .status(200)
              .send( _.pick(updatedUser, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel", "serviceProvider", "token", "createdAt"]));
};

exports.getUserAccount = async (req, res, next) => {
    const user = req.user._id;
    let isValid = mongoose.Types.ObjectId.isValid(user);
    if (!isValid) return res.status(400).send("Invalid user id");

    const userDetails = await getUser(req.params.id);

     //if user is a service provider add other details
     if (userDetails.userAccess.includes('service')){
        //updatedUser = await User.findById(user._id).populate('user');
        userDetails.serviceProvider = await ServiceProvider.findOne({user: userDetails._id});
    }

    return res.status(200).send(_.pick(userDetails, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel", "status", "serviceProvider"]))
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

    await sendPasswordResetEmail(email, resetLink);
    
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
    const user_id = req.user._id.toString();
    try {
        if (!user_id) return res.status(400).send("Invalid user id");

        const user = await User.findById(user_id);
        if (!user) return res.status(404).send("User account not found.");
        if (!await bcryptjs.compare(req.body.currentPassword, user.password)) return res.status(400).send("Current password is incorrect.");

        const updatedUser = await updateUserPassword(user_id, req.body.newPassword);
        return res.status(200).send("Password update was successful");
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

exports.updateUserNumber = async (req, res, next) => {
    const user_id = req.user._id.toString();
    try {
        if (!user_id) return res.status(400).send("Invalid user id");
        if (!req.body.phoneNumber || req.body.phoneNumber.length < 1) return res.status(400).send("Phone Number is required.");

        const user = await User.findById(user_id);
        if (!user) return res.status(404).send("User account not found.");

        const numberCheck = await User.findOne({phoneNumber: req.body.phoneNumber});
        if (numberCheck && numberCheck._id.toString() !== user_id) return res.status(400).send("The provided number already belongs to another account.");

        const updatedNumber = await User.updateOne({_id: user_id}, {
            phoneNumber: req.body.phoneNumber
        }, {new: true});

        const userDetails = await getUser(user_id);

        return res.status(200).send({
            message: 'Phone numuber update was successful',
            data: _.pick(userDetails, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel", "status"])
        })
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

exports.updateUserEmail = async (req, res, next) => {
    const user_id = req.user._id.toString();
    try {
        if (!user_id) return res.status(400).send("Invalid user id");
        if (!req.body.email || req.body.email.length < 1) return res.status(400).send("Email is required.");

        const user = await User.findById(user_id);
        if (!user) return res.status(404).send("User account not found.");

        const emailCheck = await User.findOne({email: req.body.email});
        if (emailCheck && emailCheck._id.toString() !== user_id) return res.status(400).send("The provided email already belongs to another account.");

        const updatedUser = await User.updateOne({_id: user_id}, {
            email: req.body.email.toLowerCase()
        }, {new: true});

        const userDetails = await getUser(user_id);

        return res.status(200).send({
            message: 'Email update was successful',
            data: _.pick(userDetails, ["_id", "firstName", "lastName", "email", "phoneNumber", "profilePicture", "userAccess", "userLevel", "status"])
        })
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

exports.deactivateAccount = async (req, res, next) => {
    const user_id = req.user._id.toString();
    try {
        if (!req.user._id) return res.status(400).send("Invalid user id");

        const user = await User.findById(user_id);
        if (!user) return res.status(404).send("User account not found.");

        // const activeCheck = await User.findOne({$and: [{_id: req.params.id, status: "active"}]});
        // if (!activeCheck) return res.status(400).send("The account is inactive");

        const updatedUser = await User.updateOne({_id: user_id}, {
            $set: {
                status: "inactive"
            }
        });

        return res.status(200).send('Account deactivated');
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

exports.refreshToken = async (req, res, next) => {
    const user = req.user._id;

    let token = await generateLoginToken(user);

    return res.status(200).send({
        message: "Here's your new token",
        token: token
    });
}
