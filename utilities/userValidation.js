const Joi = require('joi');

function validateUser(user) {
    const schema = Joi.object({
        firstName: Joi.string().min(2).max(150).required().label("First Name"),
        lastName: Joi.string().min(2).max(150).required().label("Last Name"),
        email: Joi.string().min(5).max(150).required().email(),
        password: Joi.string().min(8).max(1024).required().error(errors => {
            errors.forEach(err => {
                switch (err.code) {
                    case "string.min":
                        err.message = `Your Password needs to have a minimum of ${err.local.limit} characters!`;
                        break;
                    default:
                        break;
                }
            });
            return errors;
        })
    })
}

function validateUserUpdate(user) {
    const schema = Joi.object({
        firstName: Joi.string().min(2).max(150).required().label("First Name"),
        lastName: Joi.string().min(2).max(150).required().label("Last Name"),
        phoneNumber: Joi.string().min(7).max(15).required().label("Phone Number").pattern(/^[0-9]+$/),
        profilePicture: Joi.string().min(10).max(255).required().label("Profile Picture"),
    });

    return schema.validate(user);
}

async function validateEmail(email) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(150).required().email().error(errors => {
            errors.forEach(err => {
                switch (err.code) {
                    case "string.email":
                        err.message = `Please enter a valid email address`;
                        break;
                    default:
                        break;
                }
            });
            return errors;
        })
    });

    return schema.validate(email);
}

module.exports.validate = validateUser;
module.exports.validateEmail = validateEmail;
module.exports.validateUserUpdate = validateUserUpdate;