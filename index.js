const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;

//connect to mongodb
mongoose.connect('mongodb://localhost:27017/newllll', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//UserSchema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
  ],
});

//ContactSchema
const contactSchema = new mongoose.Schema({
  formData: Object,
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
});

const User = mongoose.model('User', userSchema);
const Contact = mongoose.model('Contact', contactSchema);

// Middleware
app.use(express.json());

//ErrorHandler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const validateFormData = (req, res, next) => {
  const { formData } = req.body;
  if (!formData || Object.keys(formData).length === 0) {
    return res.status(400).json({ error: 'Form data is required' });
  }
  next();
};

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    //you will have to use Bearer token and will include it in the header in value section
    //Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWZmYTEyYWQ5ZjYxOGQ3ZjViNTkzYzEiLCJpYXQiOjE3MTEyNTE3NjcsImV4cCI6MTcxMTI1NTM2N30.nfVP56KJ1IWwTDu7QUI3lGQvA8CNlsbOyvdBjF6-C8U
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = jwt.verify(token, 'your_secret_key');
    const user = await User.findById(decodedToken.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

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

const jwt = require('jsonwebtoken');

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
app.get('/access-key', async (req, res) => {
  try {
    const { userDetails } = req.body;
    const user = await User.findOne({ userDetails });
    if (user) {
      res.json({ accessKey: user._id });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve access key' });
  }
});

//Create a new contact
app.post('/submit', authenticateUser, validateFormData, async (req, res) => {
  try {
    const { formData } = req.body;
    const user = req.user;
    const contact = new Contact({ formData, user: user._id });
    await contact.save();
    user.contacts.push(contact._id);
    await user.save();
    res.json({ message: 'Form submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

//FetchAllContacts
app.get('/contacts', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    //without populate you will only return the id of the contact
    const populatedUser = await User.findById(user._id).populate('contacts');
    res.json(populatedUser.contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});