const jwt = require("jsonwebtoken");
const adminUsers = require("../models/admin-users");
const clientUsers = require("../models/client-users");

module.exports.authAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.GstBharo;
    const verifyUser = jwt.verify(token, process.env.JWT_KEY);
    console.log(`Running from Middleware ${verifyUser}`);
    // const clientUser = await clientUsers.findOne({ _id: verifyUser._id });
    const adminUser = await adminUsers.findOne({ _id: verifyUser._id });
    next();
  } catch (error) {
    console.log(error);
    res.status(401).redirect("/admin-login");
  }
};
module.exports.authClient = async (req, res, next) => {
  try {
    const token = req.cookies.GstBharo;
    const verifyUser = jwt.verify(token, process.env.JWT_KEY);
    console.log(`Running from Middleware ${verifyUser}`);
    const clientUser = await clientUsers.findOne({ _id: verifyUser._id });
    // const adminUser = await adminUsers.findOne({ _id: verifyUser._id });
    next();
  } catch (error) {
    console.log(error);
    res.status(401).redirect("/client-login");
  }
};
