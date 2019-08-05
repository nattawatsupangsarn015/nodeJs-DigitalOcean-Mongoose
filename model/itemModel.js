var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var item = new Schema({
   code: String,
   name: String,
   type: String,
   price: Number,
   description: String,
   bestSeller: Boolean,
   imageData: []
}, { versionKey: false });

module.exports = mongoose.model('item', item); 