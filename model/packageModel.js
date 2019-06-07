var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var customers = new Schema({
   name:String,
   address: String
}, { versionKey: false });

module.exports = mongoose.model('customers', customers); 