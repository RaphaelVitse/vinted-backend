const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const convertToBase64 = require("../utils/convertToBase64");
//------------------------------------

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const convertedPicture = convertToBase64(req.files.picture);
      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertedPicture,
        { folder: "vinted/offer" }
      );
      //console.log(cloudinaryResponse);
      const product_name = req.body.title;
      //console.log(product_name);
      const product_description = req.body.description;
      //console.log(product_description);
      const product_price = req.body.price;
      const product_details = [
        { MARQUE: req.body.brand },
        { TAILLE: req.body.size },
        { ETAT: req.body.condition },
        { COULEUR: req.body.color },
        { EMPLACEMENT: req.body.city },
      ];
      //const owner = req.user;
      //console.log(req.user.account);
      //console.log(product_details);
      //console.log(product_image);
      const product_image = cloudinaryResponse;

      const newOffer = new Offer({
        product_name: product_name,
        product_description: product_description,
        product_price: product_price,
        product_details: product_details,
        product_image: product_image,
        owner: req.user,
      });

      await newOffer.save();
      const returnInfo = {
        product_name: product_name,
        product_description: product_description,
        product_price: product_price,
        product_details: product_details,
        product_image: product_image,
        owner: req.user.account,
      };
      res.status(201).json(returnInfo);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.put("/offer/publish/:id", isAuthenticated, async (req, res) => {
  try {
    console.log(req.params.id);
    console.log(req.body);

    const updateProduct = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updateProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/offer/publish/:id", isAuthenticated, async (req, res) => {
  try {
    //console.log(req.params.id);
    const searchPicture = await Offer.findById(req.params.id);
    //console.log(searchPicture.product_image.secure_url);
    const pictureToDelete = searchPicture.product_image.public_id;
    //console.log(pictureToDelete);

    await Offer.findByIdAndDelete(req.params.id);
    await cloudinary.uploader.destroy(pictureToDelete);

    res.status(200).json({ Message: "Offer deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    //console.log("sur la route offers");
    console.log(req.query);

    const { title, priceMin, priceMax, page, sort } = req.query;

    let skip = 0;
    let limit = 0;
    let pageToSeach = page;
    if (!page || page === "1") {
      skip = 0;
      pageToSeach = 1;
    }
    console.log(page);

    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMax) {
      filters.product_price = { $lte: Number(priceMax) };
    }
    if (priceMin) {
      if (filters.product_price) {
        filters.product_price.$gte = Number(priceMin);
      } else {
        filters.product_price = { $gte: Number(priceMin) };
      }
    }

    const sortPrice = {};
    if (sort === "price-desc") {
      sortPrice.product_price = -1;
    } else if (sort === "price-asc") {
      sortPrice.product_price = 1;
    }

    const offers = await Offer.find(filters)
      .select("product_name product_price -_id")
      .sort(sortPrice)
      .limit(limit)
      .skip((pageToSeach - 1) * limit);

    //const totalCount = offers.length;
    //const totalCount = await Offer.find(filters).length
    const totalCount = await Offer.countDocuments(filters);

    res.status(200).json({
      count: totalCount,
      offers: offers,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    //console.log("on road");
    const offers = await Offer.findById(req.params.id)
      .populate("owner", "account")
      .select(
        "product_details product_image.secure_url product_name product_description product_price"
      );
    res.status(200).json(offers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
