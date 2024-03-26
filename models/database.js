const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();

//connect to mongodb
mongoose.connect(process.env.DATABASELINK)
.then(()=> console.log('Connected to the Database'))
.catch((err)=>console.log(err));

module.exports = mongoose;