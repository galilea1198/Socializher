var mongoose = require('mongoose');

const activity = mongoose.model('Activity', new mongoose.Schema({
    id: String,
    parentActivityId: String,
    userId: String,
    userRef: String,
    date: Date,
    details: String,
    media: [String],
    type: String,
    reactions: Object,
    comments: [String] //Array de id's de actividades
}), 'Activities');

module.exports = activity;