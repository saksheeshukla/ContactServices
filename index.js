const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

const port = process.env.PORT || 8080;

// requiring collections
const User = require('./models/user.model.js');
const Contact = require('./models/contacts.model.js');

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
const validateFormData = require('./middlewares/validateFormData.js');
const verifyToken = require('./middlewares/verifyToken.js');

//ErrorHandler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});


//Do register user
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, contacts: [] });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});


//Generate token
const generateToken = (userId) => {
  const payload = { userId };
  const token = jwt.sign(payload, 'your_secret_key', { expiresIn: '1h' });
  return token;
};

//Routes

//login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = generateToken(user._id);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});


//CreateAnewUser
app.post('/start', async (req, res) => {
  try {
    const { userDetails } = req.body;
    if (!userDetails || !userDetails.name || !userDetails.email || !userDetails.password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: userDetails.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ name: userDetails.name, email: userDetails.email, password: userDetails.password, contacts: [] });
    await user.save();
    res.json({ accessKey: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});


//GetAccessKey
app.get('/access-key', verifyToken ,async (req, res) => {
  try {
    console.log(req.user.Data.UserID);
    console.log(req.user);
    const user = await User.findOne({ name : req.user.Data.UserID });
    if (user) {
      res.status(200).json({UserID:user.name, accessKey: user._id });
    } else {
      const newuser = new User({name:req.user.Data.UserID,contacts:[]});
      await newuser.save();
      res.status(200).json({UserID:newuser.name, accessKey: newuser._id});
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server Error' });
  }
});

//Create a new contact
// app.post('/submit', validateFormData, async (req, res) => {
//   try {
//     const { formData } = req.body;
//     const user = req.user;
//     const contact = new Contact({ formData, user: user._id });
//     await contact.save();
//     user.contacts.push(contact._id);
//     await user.save();
//     res.json({ message: 'Form submitted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to submit form' });
//   }
// });

app.post('/submit', validateFormData, async (req, res) => {
  try {
    const access_key = req.body.access_key;
    const formData = { ...req.body };
    delete formData.access_key;
    const contact = new Contact({ formData : formData, user: access_key });
    await contact.save();  // new contact saved
    // now using accesskey we will find to whom the contact submission belongs ,
    // and then update the contacts array of that user with the new contact
    // we will find and update User.findOneAndUpdate({_id:access_key},{push:{contacts: contact._id}})
    const user = await User.findOne({_id:  access_key });
    if (!user) {
        throw new Error('User not found');
    }
    user.contacts.push(contact._id);
    await user.save();
    res.json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

app.delete('/delete-entry/:contactID',verifyToken, async (req,res)=>{
  try{
    const contactID = req.params.contactID;
    const user = await User.findOne({name: req.user.Data.UserID});
    if (!user) {
        throw new Error('User not found');
    }
    await Contact.deleteOne({_id:contactID, user:user._id}).then(async ()=>{
      user.contacts.remove(contactID);
      await user.save();
      res.status(200).json({message:'Contact Form Entry Deleted Succesfully'});
    }).catch((err)=>{
      res.status(500).json({error:err})
    })

  }catch (error){
    res.status(500).json({message:'Internal Server Error',Error:error});
  }
});

//FetchAllContacts        
app.get('/fetch-contacts', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ name :  req.user.Data.UserID});   // first we need to check if user exists or not
    if (!user) {                                         // applying populate on null value gives error
      const newuser = new User({name:req.user.Data.UserID,contacts:[]});
      await newuser.save();
      res.status(200).json({UserID:newuser.name,Data:[]})
    } else {
        const populatedUser = await user.populate('contacts');
        res.status(200).json({UserID:user.name,Data:populatedUser.contacts});
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
