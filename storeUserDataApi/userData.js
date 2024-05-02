const { default: mongoose } = require("mongoose");

//for schema and model
const userDataSchema = new mongoose.Schema({
  age: Number,
  gender: String,
  symptoms: Array,
  disease: Array,
});
module.exports = mongoose.model("userData", userDataSchema);
