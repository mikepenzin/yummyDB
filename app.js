var express     = require('express'),
    fs          = require('fs'),
    request     = require('request'),
    cheerio     = require('cheerio'),
    mongoose    = require('mongoose'),
    Data        = require('./models/data'),
    jsonFile    = require('./new.json'),
    arr         = require('./arr.js'),
    app         = express();

console.log(arr.length);
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/yummydb");

app.get('/getdata', function(req, res){
    var arr = [];
    
    fs.appendFile('arr.js', "module.exports = [", function (err) {
      if (err) throw err;
    });
    
    for (var i = 1; i < jsonFile.urlset.url.length; i++) {
        if ((jsonFile.urlset.url[i].loc.includes("http://www.bbcgoodfood.com/recipes/")) && (!(jsonFile.urlset.url[i].loc.includes("http://www.bbcgoodfood.com/recipes/collection")) && (!(jsonFile.urlset.url[i].loc.includes("http://www.bbcgoodfood.com/recipes/category"))))) {
            arr.push("'" + jsonFile.urlset.url[i].loc + "'");
            console.log(i + ' - Done');
        }    
    }
    
    fs.appendFile('arr.js', arr + "];", function (err) {
      if (err) throw err;
      res.send("Lets start getting data!");
    });
});


app.get('/scrap', function(req, res){
    
    Data.remove({}, function(err){
        if(err) { console.log(err); }
        console.log("All data removed from DB!");
    });
    
    for(var y = 0; y < arr.length; y++){
        (function(y){
            setTimeout(function(){
                console.log("v[" + y + "] = " + arr[y]);
                var url = arr[y];
                
                (function(url){
                    request(url, function(error, response, html){
                        if ((!(url.includes("http://www.bbcgoodfood.com/recipes/collection"))) && (!(url.includes("http://www.bbcgoodfood.com/recipes/category")))) {
                            var $ = cheerio.load(html);
                            var title, image, prep, cook, difficulty, serves, rating, rating_count, other_time, recipe_id;
                            var ingredients = [];
                            var json = {};
                            
                            $('body').filter(function(){
                                var data = $(this);
                                title = $(".recipe-header__details-first > h1").text().trim();
                                image = $(".img-container > img").attr('src');
                                if(($( ".member-banner > span").text()) === "Member recipe") {
                                    $( "ul.ingredients-list__group > li" ).each(function( index ) {
                                        $(this).find('.gf-tooltip').remove();
                                        ingredients.push($( this ).text());  
                                    });
                                } else {
                                    image = (image != undefined ? "https:" + (image.split("?")[0]) : image);
                                    $( "ul.ingredients-list__group > li" ).each(function( index ) {
                                        $(this).find('.gf-tooltip').remove();
                                        $(this).find('span').remove();
                                        ingredients.push($( this ).text());  
                                    });
                                }
                            
                                prep = $(".recipe-details__cooking-time-prep").text().replace(/ Prep: /g,'').trim();
                                cook = $(".recipe-details__cooking-time-cook").text().replace(/ Cook: /g,'').trim();
                                other_time = $(".recipe-details__cooking-time-full").text().trim();
                                difficulty = data.find(".recipe-details__item--skill-level").text().trim();
                                serves = $(".recipe-details__item--servings > span").text().replace(/Serves/g,'').trim();
                                rating = $('.rate-fivestar-btn-filled').length;
                                rating_count = $('.rate-info').text().charAt(1);
                                recipe_id = '50' + y;
                                
                                json.title = title;
                                json.image = image;
                                json.ingredients = ingredients;
                                json.prep = prep;
                                json.cook = cook;
                                json.difficulty = difficulty;
                                json.serves = serves;
                                json.publisher = "BBC GoodFood";
                                json.recipe_url = url;
                                json.rating = rating;
                                json.rating_count = Number(rating_count);
                                json.other_time = other_time;
                                json.recipe_id = Number(recipe_id);
                                    
                            });
                            (function(json){
                                Data.create(json, function (err) {
                                   console.log('Recipe: ' + y + ' were added to DB! \n Title: ' + title);
                                });               
                            })(json);
                        }    
                    });
                })(url);
            }, 100 * y);
        }(y));
    } 
    res.send(arr.length + " of Data is proccesed right now! Be patient, it will take time!");
});

app.get('/test', function(req, res){
    
    var url = "https://www.bbcgoodfood.com/recipes/2920661/american-pancakes";
    
    request(url, function(error, response, html){
        var $ = cheerio.load(html);
        var title, image, prep, cook, difficulty, serves, rating_count, rating, other_time;
        var ingredients = [];
        var json = {};
        
        $('body').filter(function(){
            var data = $(this);
            title = $(".recipe-header__details-first > h1").text().trim();
            image = $(".img-container > img").attr('src');
            if(($( ".member-banner > span").text()) === "Member recipe") {
                $( "ul.ingredients-list__group > li" ).each(function( index ) {
                    $(this).find('.gf-tooltip').remove();
                    ingredients.push($( this ).text());  
                });
            } else {
                image = "https:" + (image.split("?")[0]);
                $( "ul.ingredients-list__group > li" ).each(function( index ) {
                    $(this).find('.gf-tooltip').remove();
                    $(this).find('span').remove();
                    ingredients.push($( this ).text());  
                });
            }
        
            prep = $(".recipe-details__cooking-time-prep").text().replace(/ Prep: /g,'').trim();
            cook = $(".recipe-details__cooking-time-cook").text().replace(/ Cook: /g,'').trim();
            other_time = $(".recipe-details__cooking-time-full").text().trim();
            difficulty = data.find(".recipe-details__item--skill-level").text().trim();
            serves = $(".recipe-details__item--servings > span").text().replace(/Serves/g,'').trim();
            rating = $('.rate-fivestar-btn-filled').length;
            rating_count = $('.rate-info').text().charAt(1);
            
            json.title = title;
            json.image = image;
            json.ingredients = ingredients;
            json.prep = prep;
            json.cook = cook;
            json.difficulty = difficulty;
            json.serves = serves;
            json.publisher = "BBC GoodFood";
            json.recipe_url = url;
            json.rating_count = rating_count;
            json.rating = rating;
            json.other_time = other_time;
        });
        
        // Data.create(json, function (err) {
        //     console.log("Recipes were added to DB!");
        // });
        
        fs.writeFile('output.json', JSON.stringify(json, null, 2), function(err){
            console.log('File successfully written! - Check your project directory for the output.json file');
        });
    }); 
    console.log("Done!");
    res.send('The test finished successfull - Check your console!');
});


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("=========================");
    console.log("Yummy Scrap Server has started!");
    console.log("=========================");
});


exports = module.exports = app;