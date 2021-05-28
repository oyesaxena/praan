//jshint esversion:6

// Dependencies Called

require("dotenv").config(); // .env file configured
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const csvtojson = require("csvtojson");
const mongodb = require("mongodb");
const app = express();
const Data = require("./models/data");
const jwt = require("jsonwebtoken");
require("crypto").randomBytes(64).toString("hex");

process.env.TOKEN_SECRET;

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Function of token authentication

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.TOKEN_SECRET),
    (err, user) => {
      console.log(err);

      if (err) return res.sendStatus(403);

      req.user = user;

      next();
    };
}

// ------------------------------------------------------------------

// function to generate token, this function will be called while adding data into database using register route

function generateAccessToken(device) {
  return jwt.sign(device, process.env.TOKEN_SECRET, { expiresIn: "1800s" });
}
//-----------------------------------------------------------------------

// Database connection setup, used local host rather than mongo atlas
// Database name - praanDB
// Collection - Datas

let dbConn;
mongoose
  .connect("mongodb://localhost:27017/praanDB", {
    useNewUrlParser: true,
  })
  .then((client) => {
    console.log("DB connected");
    dbConn = client;
  })
  .catch((err) => {
    console.log(err);
  });

//--------------------------------------------------

// Post route to add a data. Device is the device name, w is wind speed, h is the direction, p1, p10 and p25 are valuess of pm1 , pm10, pm25 respectively
// While calling the route send the required data.
// Timestamp will be generated automatically and a jwt token will be generated too

app.post("/register", async (req, res) => {
  let newData = new Data({
    device: req.body.device,
    w: req.body.speed,
    h: req.body.direction,
    p1: req.body.p1,
    p10: req.body.p10,
    p25: req.body.p25,
  });
  const token = generateAccessToken({ device: req.body.device });
  res.json(token);
  newData.save((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Registered Data");
    }
  });
});

// -------------------------------------------------------------------------------------

// Below is the function in where I tried to import bulk data in our mongo db database using csv file.
// It failed in line 124 while calling the connection function. The data was though succesfully stored in array but sending to mongodb connectivity gave bug

// app.get("/abc", async (req, res) => {
//   const fileName = "sample.csv";
//   var arrayToInsert = [];
//   csvtojson()
// .fromFile(fileName)
// .then((source) => {
//   // Fetching the all data from each row
//   for (var i = 0; i < source.length; i++) {
//     var oneRow = {
//       device: source[i]["device"],
//       w: source[i]["w"],
//       h: source[i]["h"],
//       p1: source[i]["p1"],
//       p25: source[i]["p25"],
//       p10: source[i]["p10"],
//     };
//         arrayToInsert.push(oneRow);
//       } //inserting into the table “employees”
//       var collectionName = "Data";
//       console.log(collection);
//       var collection = dbConn.collection(collectionName);
//       collection.insertMany(arrayToInsert, (err, result) => {
//         if (err) console.log(err);
//         if (result) {
//           console.log("Import CSV into database successfully.");
//         }
//       });
//     });
// });

//---------------------------------------------------------------------------------------------

// Get route to check the token authentication

app.get("/tokenAuthCheck", authenticateToken, (req, res) => {
  (err) => {
    console.log(err);
  };
  console.log("Authorized");
  console.log(res.json);
  const token = res.json();

  // set token in cookie
  document.cookie = `token=${token}`;
});

// ------------------------------------------------

// Post route to pull data using device name. Jusr send device name in body parameter

app.post("/pullData", async (req, res) => {
  await Data.find({ device: req.body.device })
    .then((data) => {
      res.json(data);
      console.log("Data with asked device name -- ", data);
    })
    .catch((err) => {
      console.log("Error---", err);
    });
});
//--------------------------------------------------------------------------------------

// Post route to get PM values of any type of device name. Just send device name and p value like p1, p10 and p25
// In output we get the respective PM values asked for the particular device name

app.post("/pValues", async (req, res) => {
  let p = req.body.p;
  await Data.find({ device: req.body.device })
    .distinct(p)
    .then((data) => {
      res.json(data);
      console.log("Values of ", p, " --", data);
    })
    .catch((err) => {
      console.log("error--", err);
    });
});

// ---------------------------------------------------------------------

// Port definition. We are hosting it in port 3000

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
