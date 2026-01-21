const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    place: {
        type: String,
        required: true,
    },
    coverPhoto: {
        type:String
    },
    photos: [String],
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
