var mongoose = require("mongoose");

const dataSchema = new mongoose.Schema(
  {
    device: String,
    w: String,
    h: String,
    p1: String,
    p25: String,
    p10: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Data", dataSchema);

//   const Data = new mongoose.model("Data", dataSchema);
