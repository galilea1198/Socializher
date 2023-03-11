var mongoose = require('mongoose');

const user = mongoose.model('User', new mongoose.Schema({
    id: String,
    active: Boolean,
    username: String,
    name: String,
    lastName: String,
    sex: String,
    email: String,
    password: String,
    phone: String,
    profilePicture: String,
    profileCover: String,
    description: String,
    aptitudes: [{
        id: String,
        type: String,
        value: String
    }],
    birth: Date,
    permissions: {
        admin: Boolean,
        moderator: Boolean,
        create: Boolean,
        comment: Boolean,
        react: Boolean
    },
    sessions: Object,
    friends: [String],
}), 'Users');

module.exports = user;