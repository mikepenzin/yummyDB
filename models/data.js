var mongoose = require('mongoose');
    
var DataSchema = new mongoose.Schema({
    title: String,
    image: String,
    publisher: String,
    ingredients: [],    
    prep: String,
    cook: String,
    difficulty: String,
    serves: String,
    recipe_url: String,
    rating_count: Number,
    rating: Number,
    other_time: String,
    recipe_id: Number
});

module.exports = mongoose.model("Data", DataSchema);