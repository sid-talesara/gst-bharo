// ----------------------------------------------- Imports -----------------------------------------------
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
});

// password encryption
clientUsersSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
const clientUsers = new mongoose.model("clientUser", clientUsersSchema);
module.exports = clientUsers;
