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
const { authAdmin, authClient } = require("./middleware/auth");
const multer = require("multer");
const xlsxPopulate = require("xlsx-populate");
const storage = require("./firebase");
const fetch = require("node-fetch");
const {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
} = require("firebase/storage");
const { v4 } = require("uuid");

// ----------------------------------------------- Configurations -----------------------------------------------
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const upload = multer();

// ----------------------------------------------- MongoDB Connection -----------------------------------------------
//======== DB Connection ============
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

app.get("/reports", authAdmin, (req, res) => {
  const fileListRef = ref(storage, "client-files");
  listAll(fileListRef).then((res) => {
    console.log(res);
    res.items.forEach((item) => {
      getDownloadURL(item).then((url) => {
        fileURL = url;
        res.json(fileURL);
      });
    });
  });
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
app.get("/client-panel", authClient, (req, res) => {
  //   console.log(req.cookies.GstBharo);
  res.render("client-panel");
});
app.post("/client-file-upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  const file = req.file;

  // Set a unique filename for the uploaded file
  // const filename = Date.now() + "-" + file.originalname;

  const fileRef = ref(storage, `client-files/${v4() + file.originalname}`);

  const uploadTask = uploadBytesResumable(fileRef, req.file.buffer);
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log("Upload is " + progress + "% done");
      switch (snapshot.state) {
        case "paused":
          console.log("Upload is paused");
          break;
        case "running":
          console.log("Upload is running");
          break;
      }
    },
    (error) => {
      console.log(error);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        res.render("thankyou", { fileUrl: downloadURL });
      });
    }
  );
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
        return res.redirect("/admin-panel");
      })
      .catch((err) => {
        console.log(err);
        return res.redirect("/admin-register");
      });
  } catch (error) {
    console.log(error);
  }
});
// ======== Get Req for Login Page ========
app.get("/admin-login", (req, res) => {
  res.render("admin-login");
});
// ======== Post Req for Login Page ========
app.post("/api/admin-login", async (req, res) => {
  try {
    // compare the login cred with the cred in db
    const { email } = req.body;
    const { password } = req.body;
    const existingUser = await adminUsers.findOne({ email });

    if (existingUser) {
      const isMatch = await bcrypt.compare(password, existingUser.password);
      // JWT Middleware
      const token = await existingUser.generateAuthToken();
      res.cookie("GstBharo", token, {
        expires: new Date(Date.now() + 860000),
        httpOnly: true,
      });
      if (isMatch) {
        return res.redirect("/admin-panel");
      } else {
        return res.status(400).send("Invalid Credentials");
      }
    }
    return res.status(400).redirect("/register-admin");
  } catch (error) {
    console.log(error);
  }
});
// ======== Admin Panel  ========
app.get("/admin-panel", authAdmin, (req, res) => {
  res.render("admin-panel");
});
// Load the Excel file and send the data to the client
app.get("/load", authAdmin, async (req, res) => {
  try {
    let fileURL =
      "https://firebasestorage.googleapis.com/v0/b/mern-gst-filing-portal.appspot.com/o/client-files%2F7a604a18-6614-4b57-8e55-823b54ff7780sample.xlsx?alt=media&token=fd0a41ad-64c0-4abb-ba36-74074613a90a";
    const fileListRef = ref(storage, "client-files");
    listAll(fileListRef).then((res) => {
      console.log(res);
      res.items.forEach((item) => {
        getDownloadURL(item).then((url) => {
          fileURL = url;

          // console.log("getDOwb" + fileURL);
        });
      });
    });

    const response = await fetch(fileURL);

    const buffer = await response.buffer();
    const workbook = await xlsxPopulate.fromDataAsync(buffer);

    const worksheet = workbook.sheet(0);
    const jsonData = worksheet.usedRange().value();

    res.json(jsonData);
  } catch (error) {
    console.error("Error loading Excel file:", error);
    res.status(500).send("Error loading Excel file");
  }
});

// Save the modified data to the Excel file
app.post("/save", express.json(), (req, res) => {
  const newData = req.body;
  let fileURL =
    "https://firebasestorage.googleapis.com/v0/b/mern-gst-filing-portal.appspot.com/o/client-files%2F7a604a18-6614-4b57-8e55-823b54ff7780sample.xlsx?alt=media&token=fd0a41ad-64c0-4abb-ba36-74074613a90a";

  xlsxPopulate
    .fromFileAsync(fileURL)
    .then((workbook) => {
      const worksheet = workbook.sheet(0);
      worksheet.usedRange().clear();
      worksheet.cell(1, 1).value(newData);
      return workbook.toFileAsync(fileURL);
    })
    .then(() => {
      res.send("Data saved successfully");
    })
    .catch((error) => {
      console.error("Error saving Excel file:", error);
      res.status(500).send("Error saving Excel file");
    });
});

// ----------------------------------------------- Custom 404 Page -----------------------------------------------
app.get("*", (req, res) => {
  res.send("404 Error");
});
// ----------------------------------------------- Port Listening -----------------------------------------------
app.listen(PORT, () => {
  console.log(`Listening to Port ${PORT}`);
});
