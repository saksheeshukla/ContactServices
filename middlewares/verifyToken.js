const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const verifyToken = (req,res,next)=>{
    const token = req.headers['authtoken'];
    if(!token) return res.status(400).json({message:'Authentication Token Missing, Please Send the Token as authToken Header'});
    jwt.verify(token,process.env.secretkey,(err,decoded)=>{
        if(err) res.status(401).json({message:'Invalid Token'});
        else{
            req.user = decoded;
            next();
        }
    });
}

module.exports = verifyToken;



// const authenticateUser = async (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       //you will have to use Bearer token and will include it in the header in value section
//       //Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWZmYTEyYWQ5ZjYxOGQ3ZjViNTkzYzEiLCJpYXQiOjE3MTEyNTE3NjcsImV4cCI6MTcxMTI1NTM2N30.nfVP56KJ1IWwTDu7QUI3lGQvA8CNlsbOyvdBjF6-C8U
//       return res.status(401).json({ error: 'Authorization header is required' });
//     }
  
//     const token = authHeader.split(' ')[1];
//     try {
//       const decodedToken = jwt.verify(token, 'your_secret_key');
//       const user = await User.findById(decodedToken.userId);
//       if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//       }
//       req.user = user;
//       next();
//     } catch (error) {
//       return res.status(401).json({ error: 'Invalid token' });
//     }
//   };