const express = require("express");
const router = express.Router();
const { ServiceProvider } = require("../models/service-provider");
const { User } = require("../models/image");

const _ = require("lodash");
const mongoose = require("mongoose");


exports.legalConsent = async (req, res) => {
    const user_id = req.user._id;
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
    const user_id = req.user._id;
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
    const userId = req.user._id;
    const file = req.file;
    const filename = `profile_picture_${userId.toString()}`;
    try {
        
        //save image to cloudinary
        const options = { public_id: filename}
        const res = await cloudinary.uploader.upload(file.path, options)
        
        const user = await ServiceProvider.findById(userId);
        user.profilePicture = res.secure_url;
        await user.save();
    } catch (error) {
        
    }

}

exports.uploadIDCard = async (req, res) => {
    const userId = req.user._id;
    const files = req.files;

    const filename = `idCard_${userId.toString()}`;

    try {
       const images = await Promise.all(
        files.map( async (file) => {
            const options = { public_id: filename};
            const res = await cloudinary.uploader.upload(file.path, options);

            return {
                url: res.secure_url,
                description: 'User ID'
            };
        })
       ); 

       const user = await ServiceProvider.findById(userId);
       user.userIDImages.push(...images);
       await user.save();
    } catch (error) {
        console.log(error)
    }

}

exports.uploadCompletedJobs = async (req, res) => {
    const userId = req.user._id;
    const files = req.files;

    const filename = `completedJobs_${userId.toString()}`;

    try {
       const images = await Promise.all(
        files.map( async (file) => {
            const options = { public_id: filename};
            const res = await cloudinary.uploader.upload(file.path, options);

            return {
                url: res.secure_url,
                description: 'Completed jobs'
            };
        })
       ); 

       const user = await ServiceProvider.findById(userId);
       user.completedJobsImages.push(...images);
       await user.save();
    } catch (error) {
        console.log(error)
    }
}

exports.uploadInsurance = async (req, res) => {
    const userId = req.user._id;
    const files = req.files;

    const filename = `insurance_${userId.toString()}`;

    try {
       const images = await Promise.all(
        files.map( async (file) => {
            const options = { public_id: filename};
            const res = await cloudinary.uploader.upload(file.path, options);

            return {
                url: res.secure_url,
                description: 'Insurance'
            };
        })
       ); 

       const user = await ServiceProvider.findById(userId);
       user.insuranceImage.push(...images);
       await user.save();


    } catch (error) {
        console.log(error)
    }
}

exports.finishSetup = async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if(!user) return res.status(400).send("Invalid user id");
    user.userAccess.push("service");
    await user.save();


}