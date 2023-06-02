// ----------------------------------------------- Imports -----------------------------------------------
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// ----------------------------------------------- DB Settings -----------------------------------------------
// ======== Schema Design ========
const clientUsersSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, min: 8, max: 15, required: true },
  company: { type: String },
  phone: { type: Number },
  profession: { type: String },
  tokens: [{ token: { type: String, required: true } }],
});

// JWT Generate Auth Token Function
clientUsersSchema.methods.generateAuthToken = async function () {
  try {
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_KEY);
    this.tokens = this.tokens.concat({ token: token });
    await this.save();
    return token;
  } catch (error) {
    console.log(error);
  }
};

// password encryptionobject
clientUsersSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
const clientUsers = new mongoose.model("clientUser", clientUsersSchema);
module.exports = clientUsers;
