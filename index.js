const express = require("express");
const mongoose = require("mongoose");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

require("dotenv").config();
mongoose.connect(process.env.MONGO_URI);

const userRouter = require("./routes/user");
const offerRouter = require("./routes/offer");
const paymentRouter = require("./routes/payment");
app.use(userRouter);
app.use(offerRouter);
app.use(paymentRouter);

app.get("/", (req, res) => {
  console.log("bienvenue");
  res.status(200).json({ Message: "Bienvenue sur Vinted" });
});

app.all("*", (req, res) => {
  console.log("All routes");
  res.status(404).json({ Message: "All Routes" });
});
app.listen(process.env.PORT, (req, res) => {
  console.log("Server started 🚀");
});
