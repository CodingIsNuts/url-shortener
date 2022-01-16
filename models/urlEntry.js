const mongoose = require('mongoose');

const urlEntrySchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true
    },
    url: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('urlEntry', urlEntrySchema);
