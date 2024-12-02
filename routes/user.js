const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
//---------------------------------------

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    // const convertedPicture = convertToBase64(req.files.picture);
    // console.log(convertedPicture);

    // const cloudinaryResponse = await cloudinary.uploader.upload(
    //   convertedPicture,
    //   { folder: "vinted/avatar" }
    // );
    // let avatar = cloudinaryResponse;
    // //console.log(avatar.secure_url);
    console.log(req.body);
    const userPassword = req.body.password;
    const userName = req.body.username;
    const userEmail = req.body.email;
    const existingEmail = await User.findOne({ email: userEmail });
    //console.log("exist =" + existingEmail);

    if (!userName || !userEmail || !userPassword) {
      return res.status(400).json({ Message: "Missing parameters!" });
    }
    if (existingEmail) {
      return res.status(409).json({ Message: "Email already exists !" });
    }
    const salt = uid2(16);
    const hash = SHA256(userPassword + salt).toString(encBase64);
    const token = uid2(64);

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      token: token,
      hash: hash,
      salt: salt,
      newsletter: req.body.newsletter,
    });
    //console.log(newUser);
    await newUser.save();

    res.status(201).json({
      _id: newUser.id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ Message: "error.message" });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const loginEmail = req.body.email;
    const loginPassword = req.body.password;

    const emailAlreadyExist = await User.findOne({ email: loginEmail });
    //console.log("exists ==" + emailAlreadyExist);
    if (!emailAlreadyExist) {
      return res.status(400).json({ Message: "Unknowned email" });
    }

    const saltToRecover = emailAlreadyExist.salt;
    const hashToRecover = emailAlreadyExist.hash;
    const tokenToRecover = emailAlreadyExist.token;
    const userName = emailAlreadyExist.account.username;

    const hash2 = SHA256(loginPassword + saltToRecover).toString(encBase64);
    console.log(hash2);
    if (hash2 === hashToRecover) {
      res.status(200).json({
        Message: "Login OK",
        token: tokenToRecover,
        email: loginEmail,
        username: userName,
      });
    } else {
      res.status(400).json({ Message: "Incorrect password" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ Message: "error.message" });
  }
});

module.exports = router;
