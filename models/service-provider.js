const mongoose = require('mongoose');
const User = require("./user"); //User model

const serviceProviderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    consent: {
        type: Boolean
    },
    serviceType: {
        type: String
    },
    experience: {
        upper: { type: Number },
        lower: { type: Number }
    },
    bookingType: {
        type: String,
        enum: ['instant', 'reservation']
    },
    rate: {
        type: Number
    },
    bio: {
        type: String,
    },
    availability: {
        start: { type: Date, required: true },
        end: { type: Date }
    },
    profilePicture: {
        type: String
    },
    userIDImages: [
        {
            type: String,
            description: String
        }
    ],
    insuranceImage: [
        {
            type: String,
            description: String
        }
    ], 
    completedJobsImages: [
        {
            type: String,
            description: String
        }
    ]
    
});

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);

module.exports.ServiceProvider = ServiceProvider;