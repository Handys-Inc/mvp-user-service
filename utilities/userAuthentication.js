const { User } = require("../models/user");
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
require("dotenv").config();

async function hash(password) {
    const salt = await bcryptjs.genSalt(10);
    const hashed = await bcryptjs.hash(password, salt);
    return hashed;
};

async function createUser(user, {firstName, lastName, email, password, userAccess}) {
    try {

        const now = new Date();

        user.firstName = firstName;
        user.lastName = lastName;
        user.password = await hash(password);
        user.userLevel= "user"; //user or admin
        user.userAccess.push(userAccess); //["customer", "service"],
        user.status= "active";

        // const user = new User({
        //     firstName: body.firstName.toLowerCase(),
        //     lastName: body.lastName.toLowerCase(),
        //     email: body.email.toLowerCase(),
        //     phoneNumber: body.phoneNumber,
        //     password: await hash(body.password),
        //     profilePicture: "",
        //     userLevel: "user", //user or admin
        //     userAccess: ["customer"], //["customer", "service"],
        //     status: "active",
        //     createdAt: now,
        //     authType: 'email',
        // });

        await user.save();
        return user
        
    } catch (error) {
        console.error('unable to save user: ', error);
    }
};

async function addUserVerificationToken(id, token) {
    const user = await User.updateOne({$and: [{_id: id, deletedAt: null}]}, {
        $set: {
            verificationToken: token
        }
    });
    return user;
}

async function generateLoginToken(user) {
    const payload = {
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
      };
      
      const secret = process.env.JWT_KEY
      const expiresIn = payload.exp;
      
      const token = jwt.sign(payload, secret);
      //const token = jwt.sign({...payload, expiresIn: payload.exp}, secret);

    return {token, expiresIn};
}

async function generateVerificationToken(email) {
    try {
        const payload = {
            email: email,
            //verified: false,
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
          };
          
          const secret = process.env.JWT_KEY
          //const expiresIn = payload.exp;
          
          const token = jwt.sign(payload, secret);
          //const token = jwt.sign({...payload, expiresIn: payload.exp}, secret);

        return token;
        
    } catch (error) {
        console.log(error);
    }
    
};

async function generateResetToken(user) {
    const payload = {
        email: user.email,
        id: user._id,
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
    }

    const secret = `${process.env.JWT_KEY} ${user.password}`
    //const expiresIn = payload.exp;
      
    const token = jwt.sign(payload, secret);
    //const token = jwt.sign({...payload, expiresIn: payload.exp}, secret);

    return token;
}

async function createResetLink (token) {
    const resetLink = `${process.env.STAGING_URL}/reset-password/${token}`;
    return resetLink;
}

async function updateUserPassword (id, newPassword) {
    try {
        const user = await User.updateOne({
            $and: [{_id: id}]
        }, {$set: {password: await hash(newPassword)}});
        return user;
    } catch (error) {
        console.log('unable to create new password ', error );
    }
}




module.exports.createUser = createUser;
module.exports.addUserVerificationToken = addUserVerificationToken;
module.exports.generateLoginToken = generateLoginToken;
module.exports.generateVerificationToken = generateVerificationToken;
module.exports.generateResetToken = generateResetToken;
module.exports.createResetLink = createResetLink;
module.exports.updateUserPassword = updateUserPassword;

