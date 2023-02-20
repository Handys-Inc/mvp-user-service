const crypto = require('crypto');

async function generateAuthCode () {
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    const hash = crypto.createHash('sha256').update(timestamp + random).digest('hex');
    return hash.slice(0, 3); 
}


async function createVerificationLink ( email ) {

    const token = generateVerificationToken(email);
    const resetLink = `${process.env.APP_URL}/verify-account/${token}`;

    return {resetLink, token};

}


module.exports.generateAuthCode = generateAuthCode;
module.exports.createVerificationLink = createVerificationLink;
