const express = require("express");
const router = express.Router();
const { ServiceProvider } = require("../models/service-provider");

const _ = require("lodash");
const mongoose = require("mongoose");


exports.legalConsent = async (req, res) => {
    const user_id = req.user_id;
    let isValid = mongoose.Types.ObjectId.isValid(user_id);

    if (!isValid) return res.status(400).send("Invalid user id");

    try {
        const updateConsent = await ServiceProvider.updateOne({user: user_id}, {
            $set: {
                consent: true
            }
        });
        return res.status(200).send('Legal agreement accepted.');
    } catch (error) {
        return res.status(500).send(error.message);
    }
    
}

exports.jobProfile = async (req, res) => {
    const user_id = req.user_id;
    let isValid = mongoose.Types.ObjectId.isValid(user_id);

    if (!isValid) return res.status(400).send("Invalid user id");
    
    const { serviceType, experience, bookingType, rate, bio, availability} = req.body;

    try {
        const updateJobProfile = await ServiceProvider.updateOne({user: user_id}, {
            serviceType: serviceType,
            experience: experience,
            bookingType: bookingType,
            rate: rate,
            bio: bio,
            availability: availability,
        }, {new: true});
    
        return res.status(200)
                .send({updateJobProfile});
        
    } catch (error) {
        return res.status(500).send(error.message);
    }    
}

exports.uploadProfilePicture = async (req, res) => {

}

exports.uploadIDCard = async (req, res) => {

}

exports.uploadCompletedJobs = async (req, res) => {
    
}
