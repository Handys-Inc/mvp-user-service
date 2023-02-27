const { User } = require("../models/user");
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
require("dotenv").config();

async function hash(password) {
    const salt = await bcryptjs.genSalt(10);
    const hashed = await bcryptjs.hash(password, salt);
    return hashed;
};

async function createUser(user, {firstName, lastName, email, password}) {
    try {

        const now = new Date();

        user.firstName = firstName;
        user.lastName = lastName;
        user.password = await hash(password);
        user.userLevel= "user"; //user or admin
        user.userAccess= ["customer"]; //["customer", "service"],
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

// async function sendNewTokens(user) {
//     try {
//        let userData = {
//         //template: email_verification_template,
//         name: `${user.firstName} ${user.lastName}`,
//         email: user.email
//        };

//        const token = await user.generateAuthToken() + Date.now();

//        const verification = await crea
//        meta = {
//         "%CONFIRMATION_LINK%": config.get("verify_email") + "/" + token,
//         "%FIRST_NAME%": user.firstName,
//         "%EMAIL_ADDRESS%": user.email
//         }

//         //await addUserVerificationToken(user._id, token);
//         sendVerificationEmail(userData, meta);
    
//     } catch (error) {
        
//     }
// }

async function generateLoginToken(user) {
    const payload = {
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
      };
      
      const secret = process.env.JWT_KEY
      //const algorithm = 'ES256';
      
      const token = jwt.sign(payload, secret);

    return token;
}

async function generateVerificationToken(email) {
    try {
        const payload = {
            email: email,
            //verified: false,
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
          };
          
          const secret = process.env.JWT_KEY
          //const algorithm = 'ES256';
          
          //const token = jwt.sign(payload, secret, { algorithm });
          const token = jwt.sign(payload, secret);
    
        return token;
        
    } catch (error) {
        console.log(error);
    }
    
};

async function generateResetToken(user) {
    console.log(user);
    const payload = {
        email: user.email,
        id: user._id,
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
    }

    const secret = `${process.env.JWT_KEY} ${user.password}`
    //const algorithm = 'ES256';
      
    const token = jwt.sign(payload, secret);

    return token;
}

async function createResetLink (token) {
    const resetLink = `${process.env.APP_URL}/reset-password/${token}`;
    return {resetLink};

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
//module.exports.sendNewTokens = sendNewTokens;
module.exports.addUserVerificationToken = addUserVerificationToken;
module.exports.generateLoginToken = generateLoginToken;
module.exports.generateVerificationToken = generateVerificationToken;
module.exports.generateResetToken = generateResetToken;
module.exports.createResetLink = createResetLink;
module.exports.updateUserPassword = updateUserPassword;

