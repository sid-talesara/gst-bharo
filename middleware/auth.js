const jwt = require("jsonwebtoken");
const adminUsers = require("../models/admin-users");
const clientUsers = require("../models/client-users");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.GstBharo;
    const verifyUser = jwt.verify(token, process.env.JWT_KEY);
    console.log(`Running from Middleware ${verifyUser}`);
    const clientUser = await clientUsers.findOne({ _id: verifyUser._id });
    next();
  } catch (error) {
    console.log(error);
    res.status(401).render("client-login");
  }
};

module.exports = auth;
