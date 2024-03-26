const mongoose = require('./database.js');

//ContactSchema
const contactSchema = new mongoose.Schema({
    formData: Object,
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
  });


const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;