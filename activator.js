var mongoose = require('mongoose');

const activator = mongoose.model('Activator', new mongoose.Schema({
    id: String,
    userID: String,
    activated: Boolean
}), 'Activators');

module.exports = activator;