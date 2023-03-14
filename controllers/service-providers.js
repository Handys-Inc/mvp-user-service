const { ServiceProvider } = require("../models/service-provider");
const { User } = require("../models/user");

const _ = require("lodash");
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;


exports.legalConsent = async (req, res) => {
    const user_id = req.user._id;
    let isValid = mongoose.Types.ObjectId.isValid(user_id);

    if (!isValid) return res.status(400).send("Invalid user id");

    try {
        const updateConsent = await ServiceProvider.updateOne({user: user_id}, {
            $set: {
                consent: true
            }
        }, { upsert: true, new: true });
        return res.status(200).send('Legal agreement accepted.');
    } catch (error) {
        return res.status(500).send(error.message);
    }  
};

exports.jobProfile = async (req, res) => {
    const user_id = req.user._id;
    let isValid = mongoose.Types.ObjectId.isValid(user_id);

    if (!isValid) return res.status(400).send("Invalid user id");
    
    const { serviceType, experience, bookingType, rate, bio, availability} = req.body;
    const { upper, lower } = experience;
    const { start, end } = availability;

    try {
        const updateJobProfile = await ServiceProvider.updateOne({user: user_id}, {
            $set: {
                serviceType: serviceType,
                "experience.upper": upper,
                "experience.lower": lower,
                bookingType: bookingType,
                rate: rate,
                bio: bio,
                "availability.start": start,
                "availability.end": end
            }
        }, {new: true});
    
        return res.status(200)
                .send("User job profile updated");
        
    } catch (error) {
        return res.status(500).send(error.message);
    }    
};

exports.uploadProfilePicture = async (req, res) => {
    const userId = req.user._id;

    const file = req.file;
    const filename = `profile_picture_${userId.toString()}`;
    try {
        //save image to cloudinary
        const options = { public_id: filename, folder: 'profile-pictures'}
        const cloudinaryResponse = await cloudinary.uploader.upload(file.path, options)
        
        const user = await ServiceProvider.findOne({user: userId});

        try {
            user.profilePicture = cloudinaryResponse.secure_url;
            await user.save();
            res.status(200).send("User profile picture added");
        } catch (error) {
            res.status(500).send(`Error adding user profile picture: ${error.message}`);
        }   
    } catch (error) {
        res.status(500).send(`Error uploading picture: ${error.message}`);
    }
};

exports.uploadIDCard = async (req, res) => {
    const userId = req.user._id;

    const files = req.files;
    const filename = `idCard_${userId.toString()}`;
    try {
        //save all images to cloudinary
       const images = await Promise.all(
        files.map( async (file) => {
            const options = { public_id: filename, folder: 'id-cards'};
            const cloudinaryResponse = await cloudinary.uploader.upload(file.path, options);
            
            return cloudinaryResponse.secure_url ;
        })
       ); 

       const user = await ServiceProvider.findOne({user: userId});

       try {
            user.userIDImages.push(...images);
            await user.save();
            res.status(200).send("User ID card added");
       } catch (error) {
            res.status(500).send(`Error adding user ID card: ${error.message}`);
       }
    } catch (error) {
        res.status(500).send(`Error uploading picture: ${error.message}`);
    }
}

exports.uploadCompletedJobs = async (req, res) => {
    const userId = req.user._id;

    const files = req.files;

    const filename = `completedJobs_${userId.toString()}`;

    try {
       const images = await Promise.all(
        files.map( async (file) => {
            const options = { public_id: filename, folder: 'completed-jobs'};
            const cloudinaryResponse = await cloudinary.uploader.upload(file.path, options);

            return cloudinaryResponse.secure_url;
        })
       ); 

       const user = await ServiceProvider.findOne({user: userId});

       try {
            user.completedJobsImages.push(...images);
            await user.save();
            res.status(200).send("User completed jobs added");
        } catch (error) {
            res.status(500).send(`Error adding user completed jobs: ${error.message}`);
        }
       
    } catch (error) {
        res.status(500).send(`Error uploading picture: ${error.message}`);
    }
}

exports.uploadInsurance = async (req, res) => {
    const userId = req.user._id;

    const files = req.files;

    const filename = `insurance_${userId.toString()}`;

    try {
       const images = await Promise.all(
        files.map( async (file) => {
            const options = { public_id: filename, folder: 'insurance'};
            const cloudinaryResponse = await cloudinary.uploader.upload(file.path, options);

            return cloudinaryResponse.secure_url;
        })
       ); 

       const user = await ServiceProvider.findOne({user: userId});

       try {
            user.insuranceImage.push(...images);
            await user.save();
            res.status(200).send("User insurance added");
        } catch (error) {
            res.status(500).send(`Error adding user completed jobs: ${error.message}`);
        }
    } catch (error) {
        res.status(500).send(`Error adding user insurance: ${error.message}`);
    }
}

exports.finishSetup = async (req, res) => {
    const userId = req.user._id;
    let isValid = mongoose.Types.ObjectId.isValid(userId);

    if (!isValid) return res.status(400).send("Invalid user id");

    const user = await User.findById(userId);
    if(!user) return res.status(400).send("Invalid user id");

    try {
        user.userAccess.push("service");
        await user.save(); 
        return res.status(200).send('Completed service provided setup.');
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
}