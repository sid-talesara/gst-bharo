// ----------------------------------------------- Imports -----------------------------------------------
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ----------------------------------------------- DB Settings -----------------------------------------------
// ======== Schema Design ========
const adminUsersSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, min: 8, max: 15, required: true },
  address: { type: String },
  phone: { type: Number },
  profession: { type: String },
});

// password encryption
adminUsersSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
const adminUsers = new mongoose.model("adminUser", adminUsersSchema);
module.exports = adminUsers;
