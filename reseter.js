var mongoose = require('mongoose');

const reseter = mongoose.model('Reseter', new mongoose.Schema({
    id: String,
    userID: String
}), 'Reseters');

module.exports = reseter;