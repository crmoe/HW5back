var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./movie');
var Review = require('./review');
var jwt = require('jsonwebtoken');

// Reset database data
//User.deleteMany(function(err){if (err) throw err;});
//Movie.deleteMany(function(err){if (err) throw err;});
//Review.deleteMany(function(err){if (err) throw err;});

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code === 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, function(req, res){
        var searchParams = {};
        if (req.body.title !== '') {
            searchParams = {title: req.body.title}
        }

        var movie = Movie.find(searchParams, function(err, movie) {
            if (err) throw err;

            if(req.query.review) {
                var reviews = Review.find({title: req.body.title}, function (err, reviews) {
                    if (err) throw err;

                    res.json({success: true, movie: movie, reviews: reviews,
                                msg: 'Movie and review retrieved from database'});
                });

                if (!reviews) {
                    res.status(401).send({success: false, msg: 'Review does not exist in the database'});
                }
            }
            else {
                res.json({success: true, movie: movie, msg: 'Movie retrieved from database'});
            }
        });

        if (!movie) {
            res.status(401).send({success: false, msg: 'Movie does not exist in the database'});
        }
    })
    .post(authJwtController.isAuthenticated, function(req, res){
        console.log(req.query.review);

        var newMovie = Movie({
            title: req.body.title,
            year: req.body.year,
            genre: req.body.genre,
            actors: req.body.actors,
            imageURL: req.body.imageURL
        });

        if (!newMovie) {
            res.status(401).send({success: false, msg: 'Movie does not exist in the database'});
        }
        else {

            if(req.query.review) {
                var newReview = Review({
                    title: req.body.title,
                    username: req.body.username,
                    quote: req.body.quote,
                    rating: req.body.rating
                });

                newReview.save(function(err) {
                    if (err) throw err;
                });

                console.log('Review added with movie');
            }

            newMovie.save(function(err){
                if (err) throw err;
            });

            res.json({success: true, msg: 'Movie added to database'});
        }
    })
    .put(authJwtController.isAuthenticated, function(req, res){

        if(req.query.review) {
            var newReview = new Review({
                title: req.body.title,
                username: req.body.username,
                quote: req.body.quote,
                rating: req.body.rating
            });

            newReview.save(function(err) {
                if (err) throw err;
            });

            if(!newReview) {
                res.json({success: false, msg: 'Invalid body params'});
            }
            else {
                res.json({success: true, msg: 'New review added to movie'});
            }
        }
        else {
            var reqMovie = {
                title: req.body.title,
                year: req.body.year,
                genre: req.body.genre,
                actors: req.body.actors
            };
            var updatedMovie = {
                title: req.body.newTitle,
                year: req.body.newYear,
                genre: req.body.newGenre,
                actors: req.body.newActors
            };

            var movie = Movie.findOneAndUpdate(reqMovie, updatedMovie, function (err) {
                if (err) throw err;
            });

            if (!movie) {
                res.status(401).send({success: false, msg: 'Movie does not exist in the database'});
            } else {
                res.json({success: true, msg: 'Movie updated database'});
            }
        }
    })
    .delete(authJwtController.isAuthenticated, function(req, res){
        var movie = Movie.deleteOne({title: req.body.title}, function(err){
            if (err) throw err;
        });

        if (!movie) {
            res.status(401).send({success: false, msg: 'Movie does not exist in the database'});
        }
        else {
            res.json({success: true, msg: 'Movie deleted from database'});
        }
    });

router.route('/');

app.use('/', router);
app.listen(process.env.PORT || 8080);
