const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    mobile: {
        type: String,
    },
    email: {
        type: String,
    },
    query: {
        type: String,
    }
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;
