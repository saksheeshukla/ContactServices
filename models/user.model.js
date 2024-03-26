const mongoose = require('./database.js');

//UserSchema
const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        default : []
      },
    ],
  });

  const User = mongoose.model('User', userSchema);

  module.exports = User;