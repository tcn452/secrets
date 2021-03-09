//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');




const app = express();


app.use(express.static("public"));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser :true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});





const User = new mongoose.model("User",userSchema);

app.route('/').get(function(req, res){
    res.render('home')
})

app.route('/login').get(function(req, res){
    res.render('login')
}).post(function(req, res){
    const username = req.body.username;
    const password = req.body.password;

 User.findOne({email:username},function(err,foundUser){
     if(err){
         console.log(err)
     }else{
         if(foundUser){
            bcrypt.compare(password,foundUser.password).then((result) => {
                if (result === true){
                    res.render("secrets")
                }
            })
         }
     }

 })
})

app.route('/register').get(function(req, res){
    res.render('register')
}).post(function(req, res){
    bcrypt.genSalt(10, function (err,salt){
        bcrypt.hash(req.body.password,salt,function(err,hash){
            const newUser = new User({
                email:req.body.username,
                password: hash
            });
            if(newUser.email !== "" && newUser.password !==""){
                newUser.save(function(err){
                    if (err){
                        res.send(err);
                    }else{
                        res.render('secrets')
                    }
                })
            }

        });
    });


})
app.listen(3000,function(){console.log('Server listening on port 3000')});