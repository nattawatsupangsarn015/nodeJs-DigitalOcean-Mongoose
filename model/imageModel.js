var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var image = new Schema({
   productImage: String,
   productId: String,
   imageName: String,
   imagePath: String,
   key: String,
   selectCover: Boolean
}, { versionKey: false });

module.exports = mongoose.model('image', image); 