const User = require("../models/user");
const jwt = require('jsonwebtoken');
const _ = require('lodash')

const mailgun = require("mailgun-js");
const DOMAIN = "sandbox82ae6bbf1f144c7697f2c31785d57581.mailgun.org";
const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });

//Create user without email account activation
// exports.signup = (req, res) => {
//   console.log(req.body);
//   const { name, email, password } = req.body;
//   User.findOne({ email }).exec((err, user) => {
//     if (user) {
//       return res
//         .status(400)
//         .json({ error: "User with this email address already exists." });
//     }
//     let newUser = new User({ name, email, password });
//     newUser.save((erro, success) => {
//       if (erro) {
//         console.log("Error in signup: ", erro);
//         return res.status(400).json({ error: erro });
//       }
//       res.json({
//         message: "Signup Success!",
//       });
//     });
//   });
// };

exports.signup = (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res
        .status(400)
        .json({ error: "User with this email address already exists." });
    }
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACC_ACTIVATE,
      { expiresIn: "20m" }
    );

    const data = {
      from: "noreply@email.com",
      to: email,
      subject: "Account Activation Link",
      html: `
      <h2>Please click on the given link to activate your account </h2>
      <p>${process.env.CLIENT_URL}/authentication/activate/${token}</p>
      `,
    };
    mg.messages().send(data, function (error, body) {
      if (error) {
        return res.json({
          message: err.message,
        });
      }
      return res.json({
        message: "Email has been sent, please activate your account",
      });
    });
  });
};

exports.activateAccount = (req, res) => {
  const { token } = req.body;
  if (token) {
    jwt.verify(token, process.env.JWT_ACC_ACTIVATE, (err, decodedToken) => {
      if (err) {
        return res.status(400).json({ error: "Incorrect or expired link" });
      }
      const { name, email, password } = decodedToken;

      User.findOne({ email }).exec((error, user) => {
        if (user) {
          return res
            .status(400)
            .json({ error: "User with this email address already exists." });
        }
        let newUser = new User({ name, email, password });
        newUser.save((err, success) => {
          if (err) {
            console.log("Error in signup while account activates: ", err);
            return res.status(400).json({ error: "Error Activating account" });
          }
          res.json({
            message: "Signup Success!",
          });
        });
      });
    });
  } else {
    return res.json({ error: "Something went wrong!" });
  }
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res
        .status(400)
        .json({ error: "User with this email does not exist." });
    }
  });

  const token = jwt.sign({ _id: User._id }, process.env.RESET_PASSWORD_KEY, {
    expiresIn: "20m",
  });

  const data = {
    from: "noreply@email.com",
    to: email,
    subject: "Account Activation Link",
    html: `
    <h2>Please click on the given link to reset your password</h2>
    <p>${process.env.CLIENT_URL}/authenticate/resetpassword/${token}</p>
    `,
  };

  return User.updateOne({ resetLink: token }, (err, success) => {
    if (err) {
      return res.status(400).json({ error: "Reset password link error" });
    } else {
      mg.messages().send(data, function (error, body) {
        if (error) {
          return res.json({
            message: err.message,
          });
        }
        return res.json({
          message: "Email has been sent, please follow the instructions",
        });
      });
    }
  });
};

exports.resetPassword = (req, res) => {
  const { resetLink, newPass } = req.body;
  if (resetLink) {
    jwt.verify(
      resetLink,
      process.env.RESET_PASSWORD_KEY,
      (err, decodedData) => {
        if (err) {
          return res.status(401).json({
            error: "Incorrect token or expired.",
          })
        }
        User.findOne({resetLink}, (err,user)=>{
            if(err||!user){
                return res.status(400).json({error: "User with this token does not exist."});
            }

            const obj = {
                password:newPass,
                resetLink:'',

            }
            user = _.extend(user,obj);

            user.save((err,result)=>{
                if(err){
                    return res.status(400).json({error: "Reset Password Error"});
                }else{
                    return res.status(200).json({message: "Your password has been changed"});

                }
            })
        })
      }
    );
  } else {
    return res.status(401).json({ error: "Authentication error" });
  }
};

exports.signin = (req,res) =>{
    const {email,password} = req.body;
    User.findOne({email}).exec((err,user)=>{
        if(err){
            return res.status(400).json({
                error: "This user does not exist, sign up required."
            })
        }

        if(user.password !== password){
            return res.status(400).json({
                error: "Email or password incorrect"
            })
        }
        const token = jwt.sign({ name, email, password },process.env.JWT_ACC_ACTIVATE,{ expiresIn: "20m" });
      
    })
}

//Activation
//http://localhost:3000/authentication/activate/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZ3VzdGF2byIsImVtYWlsIjoiamd1c211bm96QGdtYWlsLmNvbSIsInBhc3N3b3JkIjoicGFzc3dvcmQiLCJpYXQiOjE2MjA5MzQ5ODIsImV4cCI6MTYyMDkzNjE4Mn0.9XaZj2vxtkM2SmiKKIJiQOw-E9l5TBRaj7jtWukSytY

//Reset Password
//http://localhost:3000/resetpassword/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MjA5Mzg2MDUsImV4cCI6MTYyMDkzOTgwNX0.5djt-d-JhQqZt8j_T-wXSOue_dQN4dpNKAakBnBrFhs