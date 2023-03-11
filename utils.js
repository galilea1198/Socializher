const constants = require("./constants");

module.exports = {
    generateUserUniqueID: function (email) {
        var tokenFirstPart = email;
        var tokenUniqueID = Date.now();
        var token = tokenFirstPart + tokenUniqueID;
        return Buffer.from(token).toString('base64').replace(/\=/g, 'x');;
    },
    generateError: function (code, error) {
        switch (code) {
            case constants.ERROR_CODES.INVALID_FIELD:
                return {
                    code: code,
                    message: (error.details ? error.details[0].message : error)
                };
                break;
            default:
                return {
                    code: code,
                    message: error
                }
                break;
        }
    },
    generateSessionToken: function() {
        var tokenPartA = Date.now().toString();
        var tokenPartB = Date.now().toString();
        var tokenPartC = Date.now().toString();
        var token = tokenPartA + tokenPartB + tokenPartC;
        return Buffer.from(token).toString('base64').replace(/\=/g, 'x');
    },
    generateActivatorID: function(userID) {
        var tokenPartA = Date.now().toString();
        var tokenPartB = Date.now().toString();
        var tokenPartC = Date.now().toString();
        var token = tokenPartA + tokenPartB + tokenPartC;
        token = token + userID;
        return Buffer.from(token).toString('base64').replace(/\=/g, 'x');
    }
};