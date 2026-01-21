const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    email: {
        type: String,
    }
});

const NewsLetter = mongoose.model('NewsLetter', newsSchema);

module.exports = NewsLetter;
