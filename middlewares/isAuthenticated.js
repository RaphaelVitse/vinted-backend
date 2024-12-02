const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  //console.log("dans isauthentificated");

  const token = req.headers.authorization.replace("Bearer ", "");
  //console.log(token);
  const user = await User.findOne({ token: token });
  //console.log(user);
  if (!user || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = user;
  next();
};

module.exports = isAuthenticated;
