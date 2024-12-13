var express = require('express');
var router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require('../models/User')

const isAuthenticated = require('../middleware/isAuthenticated')

const saltRounds = 10

/* GET users listing. */
router.post('/signup', (req, res) => {

  const { email, password } = req.body;

  if (!email || !password ) {
    res.status(401).json({ message: "Please provide both fields: Email & Password" });
    return;
  }

  // Use regex to validate the email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(401).json({ message: "Please provide a valid email address." });
    return;
  }

  if (password.length < 3) {
    res.status(401).json({ message: "Please provide a Password that is at least 3 characters long." });
    return;
  }
  
  // Create a new user
  // Check the users collection if a user with the same email already exists
  User.findOne({ email })
    .then((foundUser) => {
      // If the user with the same email already exists, send an error response
      if (foundUser) {
        res.status(401).json({ message: "User already exists." });
        return;
      }

      // If the email is unique, proceed to hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create a new user in the database
      // We return a pending promise, which allows us to chain another `then`
      User.create({ email, password: hashedPassword })
        .then((createdUser) => {
          // Deconstruct the newly created user object to omit the password
          // We should never expose passwords publicly
          const { email, _id } = createdUser;

          // Create a new object that doesn't expose the password
          const payload = { email, _id };

          // Send a json response containing the user object
          const userToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            algorithm: "HS256",
            expiresIn: "1h",
          });

          // Send the token as the response
          res.status(200).json({ userToken });
        })
        .catch((err) => {
          if (err instanceof mongoose.Error.ValidationError) {
            console.log("This is the error", err);
            res.status(501).json({ message: "Provide all fields", err });
          } else if (err.code === 11000) {
            console.log("Duplicate value", err);
            res
              .status(502)
              .json({ message: "Invalid name, password, email.", err });
          } else {
            console.log("Error =>", err);
            res.status(503).json({ message: "Error encountered", err });
          }
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
})


// LOG IN (log into a user account)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if email or password are provided as empty string
  if (!email || !password) {
    res.status(400).json({ message: "Provide both email and password." });
    return;
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { email, _id } = foundUser;

        // Create a new object that doesn't expose the password
        const payload = { email, _id };

        // Send a json response containing the user object
        const userToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
          algorithm: "HS256",
          expiresIn: "1h",
        });

        // Send the token as the response
        res.status(200).json({ userToken });
      } else {
        res.status(401).json({ message: "Incorrect username or password" });
      }
    })
    .catch((err) => res.status(500).json({ message: "Incorrect username or password" }));
})

router.get("/verify", isAuthenticated, (req, res, next) => {
  res.status(201).json(req.user);
});

module.exports = router;
