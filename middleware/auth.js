const jwt = require("jsonwebtoken");
const adminUsers = require("../models/admin-users");
const clientUsers = require("../models/client-users");

const authAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.GstBharoAdmin;
    const verifyUser = jwt.verify(token, process.env.JWT_KEY);
    console.log(`Running from Middleware ${verifyUser}`);
    // const clientUser = await clientUsers.findOne({ _id: verifyUser._id });
    const adminUser = await adminUsers.findOne({ _id: verifyUser._id });
    next();
  } catch (error) {
    console.log(process.env.JWT_KEY);
    res.status(401).redirect("/admin-login");
  }
};
const authClient = async (req, res, next) => {
  try {
    const token = req.cookies.GstBharoClient;
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

module.exports = { authAdmin, authClient };
