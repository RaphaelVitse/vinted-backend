const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE);

const router = express.Router();

router.post("/payment", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      title: req.body.title,
      amount: req.body.amount,
      currency: "eur",
    });
    res.status(200).json(paymentIntent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
