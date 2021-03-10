//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');




const app = express();


app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser :true});
mongoose.set("useCreateIndex", true);
const secretSchema = new mongoose.Schema({
    content : String
})
const userSchema = new mongoose.Schema({
    username:String,
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose, {usernameUnique: false});
userSchema.plugin(findOrCreate);
const Secret = new mongoose.model("Secret", secretSchema);
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id, username: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));



app.route('/').get(function(req, res){
    res.render('home')
})

app.route('/auth/google').get(
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/secrets');
    });

app.route('/login').get(function(req, res){
    res.render('login')
}).post(function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
        req.login(user, function(err){
            if (err){
                console.log(err);
            }else{
                passport.authenticate("local")(req, res,function() {
                    res.redirect('/secrets');
                })
            }
        })
    }
)
app.route('/logout').get(function (req, res) {
    req.logout();
    res.redirect('/');

})
app.route("/secrets").get(function(req, res){
    Secret.find({}, function(err,foundSecrets){
        if (err){
            console.log(err);
        }else {
            if (foundSecrets){
                res.render("secrets", {secretsContent:foundSecrets})
            }
        }
    })
})

app.route('/register').get(function(req, res){
    res.render('register')
}).post(function (req,res) {
    User.register({username: req.body.username}, req.body.password, function (err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        }else {
            passport.authenticate("local")(req,res,function() {
                res.redirect("/secrets");
            })

        }
    })
}

    )

app.route('/submit')
    .get(function (req, res){
    if (req.isAuthenticated()){
        res.render('submit')
    } else{
        res.redirect('/login')
    }})
    .post(function (req, res){
        const submittedSecret = new Secret({content : req.body.secret})
        submittedSecret.save(function(err,submitted){
            if (err){
                console.log(err);
            }else  {
                res.redirect('/secrets');
            }
        })

        // User.findById(req.user.id,function(err, foundUser) {
        //     if(err){
        //         console.log(err);
        //     }else{
        //         if (foundUser) {
        //             foundUser.secret = submittedSecret;
        //             foundUser.save(function () {
        //                 res.redirect('/secrets')
        //             })
        //         }
        //     }
        //
        // })

})
app.listen(3000,function(){console.log('Server listening on port 3000')});