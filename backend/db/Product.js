const mongoose = require('mongoose');

// now create product schema

const productSchema = new mongoose.Schema({
    name:String,
    price:String,
    category:String,
    userId:String,
    company:String
});

module.exports = mongoose.model('products', productSchema);