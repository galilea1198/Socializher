const Joi = require('@hapi/joi');

const validator = {
    register: function(body) {
        const schema = Joi.object({
            name: Joi.string().required(),
            lastName: Joi.string().required(),
            sex: Joi.string().valid('H', 'M').required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(16).required(),
            phone: Joi.string().min(10).max(10).optional(),
            birth: Joi.date().optional()
        });

        return schema.validate(body);
    },
    login: function(loginData) {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(16).required()
        });

        return schema.validate(loginData);
    },
    activity: function(activity) {
        const schema = Joi.object({
            details: Joi.string().required(),
            type: Joi.string().valid('POST', 'COMMENT').required(),
            userRef: Joi.string().optional(),
            images: Joi.any().optional(),
            parentActivityId: Joi.string().optional()
        });

        return schema.validate(activity);
    },
    reaction: function(reactionType) {
        const schema = Joi.string().valid('LIKE', 'DISLIKE', 'LOVE', 'HAPPY', 'SAD').required();
        return schema.validate(reactionType);
    },
    resetPassword: function(reseter) {
        const schema = Joi.object({
            resetToken: Joi.string().required(),
            password: Joi.string().min(8).max(16).required()
        });

        return schema.validate(reseter);
    }
};

module.exports = validator;