// ----------------------------------------------- Imports -----------------------------------------------
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const PORT = process.env.PORT || 3000;
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const adminUsers = require("./models/admin-users");
const clientUsers = require("./models/client-users");
const mongoose = require("mongoose");
// ----------------------------------------------- Configurations -----------------------------------------------
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// ----------------------------------------------- MongoDB Connection -----------------------------------------------
// DB Connection
mongoose
  .connect(process.env.MONGODB_URI, { useUnifiedTopology: true })
  .then(() => {
    console.log("The DB is succesfully connected");
  })
  .catch((err) => {
    console.log(err);
  });
// ----------------------------------------------- HomePage Request -----------------------------------------------
app.get("/", (req, res) => {
  res.render("home");
});
// ----------------------------------------------- Client LoginPage Request -----------------------------------------------
// ======== Get Req for Client Register Page ========
app.get("/register-client", (req, res) => {
  res.status(200).render("client-register");
});
// ======== Post Req for Client Register Page ========
app.post("/api/register-client", async (req, res) => {
  try {
    const userData = new clientUsers({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
      company: req.body.company,
      phone: req.body.phone,
      profession: req.body.profession,
    });
    const { email } = req.body;
    const existingUser = await clientUsers.findOne({ email });

    // if username exists it return an error
    if (existingUser) {
      console.log(existingUser);
      return res.status(201).json({ error: "Email is already in use" });
    }
    // if username is available then it creates a new user
    console.log("Emailavailable");

    userData
      .save()
      .then(() => {
        console.log("Data saved successfully");
        return res.status(201).render("home");
      })
      .catch((err) => {
        console.log(err);
        return res.render("client-register");
      });
  } catch (error) {
    console.log(error);
  }
});
// ======== Get Req for Login Page ========
app.get("/client-login", (req, res) => {
  res.status(200).render("client-login");
});
// ======== Post Req for Login Page ========
app.post("/api/client-login", async (req, res) => {
  try {
    // compare the login cred with the cred in db
    const { email } = req.body;
    const { password } = req.body;
    const existingUser = await clientUsers.findOne({ email });

    if (existingUser) {
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (isMatch) {
        return res.status(200).render("home");
      } else {
        return res.status(400).send("Invalid Credentials");
      }
    }
    return res.status(400).send("Yoo Boi, Kuch toh dikkat hai");
  } catch (error) {
    console.log(error);
  }
});
// ======== Client Panel  ========
app.get("/client-panel", (req, res) => {
  res.send("Client Panel");
});
// ----------------------------------------------- Admin  Request -----------------------------------------------
// ======== Get Req for Admin Register Page ========
app.get("/register-admin", (req, res) => {
  res.render("admin-register");
});
// ======== Post Req for Admin Register Page ========
app.post("/api/register-admin", async (req, res) => {
  try {
    const userData = new adminUsers({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
      address: req.body.address,
      phone: req.body.phone,
      profession: req.body.profession,
    });
    const { email } = req.body;
    const existingUser = await adminUsers.findOne({ email });
    // if username exists it return an error
    if (existingUser) {
      return res.status(201).json({ error: "Email is already in use" });
    }
    // if username is available then it creates a new user
    console.log("Emailavailable");

    userData
      .save()
      .then(() => {
        console.log("Data saved successfully");
        return res.status(201).render("home");
      })
      .catch((err) => {
        console.log(err);
        return res.render("admin-register");
      });
  } catch (error) {
    console.log(error);
  }
});
// ======== Get Req for Login Page ========
app.get("/admin-login", (req, res) => {
  res.send("Admin Login Page");
});
// ======== Post Req for Login Page ========
app.post("/api/admin-login", (req, res) => {
  res.send("Admin Login Page");
});
// ======== Admin Panel  ========
app.get("/admin-panel", (req, res) => {
  res.send("Admin Panel");
});

// ----------------------------------------------- Custom 404 Page -----------------------------------------------
app.get("*", (req, res) => {
  res.send("404 Error");
});
// ----------------------------------------------- Port Listening -----------------------------------------------
app.listen(PORT, () => {
  console.log(`Listening to Port ${PORT}`);
});
