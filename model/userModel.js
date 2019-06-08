var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user = new Schema({
   username: String,
   password: String
}, { versionKey: false });

module.exports = mongoose.model('user', user); 