const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.options("*", cors());

const userRoutes = require('./routes/users');

app.get("/api", (req, res, next) => { return res.status(200).json({message: "Welcome to Handys User Service"})});
app.use("/api/users", userRoutes);

const port = process.env.PORT || 5000 ;

mongoose
  .connect(process.env.MONGO_DB)
  .then(result => {
    app.listen(port, () => console.log(`Express started on port ${port}`));
  })
  .catch(err => console.log(err));