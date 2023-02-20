const { User } = require("../models/user");
const jwt = require('jsonwebtoken');
require("dotenv").config();


async function hash(password) {
    const salt = await bcryptjs.genSalt(10);
    const hashed = await bcryptjs.hash(password, salt);
    return hashed;
}

async function createUser(body) {
    try {
        const user = new User({
            firstName: body.firstName.toLowerCase(),
            lastName: body.lastName.toLowerCase(),
            email: body.email.toLowerCase(),
            phoneNumber: body.phoneNumber,
            password: await hash(body.password),
            profilePicture: "",
            userLevel: "user",
            userAccess: ["customer"], //["customer", "service"],
            status: "active",
            createdAt: Date.now,
            authType: 'email',
        });

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

async function generateVerificationToken(email) {
    const payload = {
        email: email,
        verified: false,
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
      };
      
      const secret = process.env.JWT_KEY
      const algorithm = 'ES256';
      
      const token = jwt.sign(payload, secret, { algorithm });

    return token;
}




module.exports.createUser = createUser;
//module.exports.sendNewTokens = sendNewTokens;
module.exports.addUserVerificationToken = addUserVerificationToken;
module.exports.generateVerificationToken = generateVerificationToken;

