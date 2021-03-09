//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser :true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = "Thisisourlittlesecret.";

userSchema.plugin(encrypt,{secret:secret, encryptedFields: ['password']} );

const User = new mongoose.model("User",userSchema);

app.route('/').get(function(req, res){
    res.render('home')
})

app.route('/login').get(function(req, res){
    res.render('login')
}).post(function(req, res){
 User.exists({email:req.body.username, password:req.body.password},function(err,foundUser){
     if (foundUser === true){
         res.render('secrets')
     }else{
         if (foundUser === false){
             console.log('incorrect username or password')
         }else{
             res.send(err)
         }
     }
 })
})

app.route('/register').get(function(req, res){
    res.render('register')
}).post(function(req, res){
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save(function(err){
        if (err){
            res.send(err)
        }else{
            res.render("secrets");
        }
    })
})
app.listen(3000,function(){console.log('Server listening on port 3000')});