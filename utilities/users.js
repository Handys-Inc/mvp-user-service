
const { User } = require("../models/user");

async function getUser (id) {
    try {
        const user = await User.findOne(id)
        .select({
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            phoneNumber: 1,
            profilePicture: 1,
            userLevel: 1,
            userAccess: 1,
            verified: 1,
            status: 1,
        });

        return user;
    } catch (error) {
        console.error('unable to get user', error);
    }
};

async function getUserByEmail(email) {
    try {

        const user = await User.findOne(email);

        return user;
    } catch (ex) {
        console.error('unable to get user', error);
    }
}

module.exports.getUser = getUser;
module.exports.getUserByEmail = getUserByEmail;