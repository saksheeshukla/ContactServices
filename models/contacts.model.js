const mongoose = require('./database.js');

// ContactSchema
const contactSchema = new mongoose.Schema({
    formData: Object,
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
}, {
    timestamps: true // Add timestamps for createdAt and updatedAt
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
