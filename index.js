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
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
const multer = require("multer");
const admin = require("firebase-admin");
const fs = require("fs");
const XLSX = require("xlsx");
const xlsxPopulate = require("xlsx-populate");
// const bucket = require("./firebase");
// ----------------------------------------------- Configurations -----------------------------------------------
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const serviceAccount = require("./public/mern-gst-filing-portal-firebase-adminsdk-603j8-f21d70cc25.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mern-gst-filing-portal-default-rtdb.firebaseio.com",
});

const bucket = admin
  .storage()
  .bucket("gs://mern-gst-filing-portal.appspot.com");
const upload = multer();
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
// ======== Admin Panel  ========
app.get("/admin-panel", (req, res) => {
  res.render("admin-panel");
});

// Load the Excel file and send the data to the client
app.get("/load", (req, res) => {
  xlsxPopulate
    .fromFileAsync("./public/sample.xlsx")
    .then((workbook) => {
      const worksheet = workbook.sheet(0);
      const jsonData = worksheet.usedRange().value();
      res.json(jsonData);
    })
    .catch((error) => {
      console.error("Error loading Excel file:", error);
      res.status(500).send("Error loading Excel file");
    });
});

// Save the modified data to the Excel file
app.post("/save", express.json(), (req, res) => {
  const newData = req.body;
  xlsxPopulate
    .fromFileAsync("./public/sample.xlsx")
    .then((workbook) => {
      const worksheet = workbook.sheet(0);
      worksheet.usedRange().clear();
      worksheet.cell(1, 1).value(newData);
      return workbook.toFileAsync("./public/sample.xlsx");
    })
    .then(() => {
      res.send("Data saved successfully");
    })
    .catch((error) => {
      console.error("Error saving Excel file:", error);
      res.status(500).send("Error saving Excel file");
    });
});

app.post("/client-file-upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  const file = req.file;

  // Set a unique filename for the uploaded file
  const filename = Date.now() + "-" + file.originalname;

  // Upload the file to Firebase Storage
  const fileUpload = bucket.file(filename);
  const fileStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    resumable: false,
  });

  fileStream.on("error", (error) => {
    console.error("Error uploading file:", error);
    res.status(500).send("An error occurred while uploading the file.");
  });

  fileStream.on("finish", () => {
    // Generate a public download URL for the uploaded file
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Send the file URL as the response
    // res.send(fileUrl);
    res.render("thankyou", { fileUrl: fileUrl });
  });

  fileStream.end(file.buffer);
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
    console.log("Email available");

    // JWT Middleware
    const token = await userData.generateAuthToken();
    res.cookie("GstBharo", token, {
      expires: new Date(Date.now() + 86000),
      httpOnly: true,
    });
    userData
      .save()
      .then(() => {
        console.log("Data saved successfully");
        return res.status(201).render("client-login");
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
      // JWT Middleware
      const token = await existingUser.generateAuthToken();
      res.cookie("GstBharo", token, {
        expires: new Date(Date.now() + 860000),
        httpOnly: true,
      });
      if (isMatch) {
        return res.redirect("/client-panel");
      } else {
        return res.status(400).send("Invalid Credentials");
      }
    }
    return res.status(400).redirect("/client-register");
  } catch (error) {
    console.log(error);
  }
});
// ======== Client Panel  ========
app.get("/client-panel", auth, (req, res) => {
  //   console.log(req.cookies.GstBharo);
  res.render("client-panel");
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

// ----------------------------------------------- Custom 404 Page -----------------------------------------------
app.get("*", (req, res) => {
  res.send("404 Error");
});
// ----------------------------------------------- Port Listening -----------------------------------------------
app.listen(PORT, () => {
  console.log(`Listening to Port ${PORT}`);
});
