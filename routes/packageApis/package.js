const _ = require('lodash');
const express = require('express');
const route = express.Router()
const crypto = require('crypto')

const jwt = require("jwt-simple");
const passport = require("passport");

//ใช้ในการ decode jwt ออกมา
const ExtractJwt = require("passport-jwt").ExtractJwt;
//ใช้ในการประกาศ Strategy
const JwtStrategy = require("passport-jwt").Strategy;

const SECRET = "see-you-too-shop-SYTS";

//สร้าง Strategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader("authorization"),
    secretOrKey: SECRET
};

const jwtAuth = new JwtStrategy(jwtOptions, (user, done) => {

    var mongoose = require('mongoose');
    var userModel = require('../../model/userModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})
    
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        userModel.find( (err, result) => {
            if (err) return console.error(err);
            var checkData = _.find(result, {username: user.username});
            if (checkData) done(null, true);
            else done(null, false);
        });
    });
});

// เสียบ Strategy เข้า Passport
passport.use(jwtAuth);

// ทำ Passport Middleware
const requireJWTAuth = passport.authenticate("jwt",{session:false});

route.get("/checkUser", requireJWTAuth, (req, res) => {
    res.send("YEAH");
});

//ทำ Middleware สำหรับขอ JWT
const loginMiddleWare = (req, res, next) => {
    var mongoose = require('mongoose');
    var userModel = require('../../model/userModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        userModel.find( (err, result) => {
            // if (err) return console.error(err);
            var checkData = _.find(result, {username: req.body.username, password: crypto.createHash('md5').update(req.body.password).digest("hex")});
            console.log(result)
            console.log(req.body)
            console.log(checkData)
            if(checkData){
                const payload = {
                    username: req.body.username,
                    iat: new Date().getTime()//มาจากคำว่า issued at time (สร้างเมื่อ)
                };
            
                res.send(jwt.encode(payload, SECRET));
            }
            else res.send("Wrong username and password");
        });
    });
};

route.post("/login", loginMiddleWare, (req, res) => {
    res.send("Login success!")
})

route.post("/registerUser", (req, res) => {
    var mongoose = require('mongoose');
    var userModel = require('../../model/userModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})

    var user = new userModel({
        username: req.body.username,
        password: crypto.createHash('md5').update(req.body.password).digest("hex")
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        userModel.find( (err, result) => {
            if (err) return console.error(err);
            var checkDuplicate = _.find(result, {username: user.username});
            if(checkDuplicate) return res.status(500).send("Your username is already have in database.")
            else {
                userModel.create(user, (err, result) => {
                    if(err) return console.log(err)
                    res.status(201).send("Created user success!");
                });
            }
        });
    });
});
 
route.get('/customers', (req, res) => {
    var mongoose = require('mongoose');
    var customersModel = require('../../model/packageModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        customersModel.find( (err, result) => {
            if (err) return console.error(err);
            res.send(result)
        });
    });
})

route.get('/customers/:id', (req, res) => {
    var mongoose = require('mongoose');
    var customersModel = require('../../model/packageModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        customersModel.find( (err, result) => {
            if (err) return console.error(err);
            res.send(result.find(customer => customer.id === req.params.id))
        });
    });
})

route.put('/customers/:id', (req, res) => {
    var mongoose = require('mongoose');
    var customersModel = require('../../model/packageModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})

    var customer = {
        name: req.body.name,
        address: req.body.address
    }

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        customersModel.findOneAndUpdate({_id: req.params.id}, customer, (err, result) => {
            if(err) return res.send(err)
            res.send(result)
        })  
    });
}) 

route.post('/customers', (req, res) => {
    var mongoose = require('mongoose');
    var customersModel = require('../../model/packageModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})

    var customer = new customersModel({
        name: req.body.name,
        address: req.body.address
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        customersModel.create(customer, (err, result) => {
            if(err) return console.log(err)
            res.send(result)
        });
    });
})

route.delete('/customers/:id', (req, res) => {
    var mongoose = require('mongoose');
    var customersModel = require('../../model/packageModel.js');
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true})

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        customersModel.deleteOne({ _id: req.params.id }, (err, result) => {
            if(err) return res.send(err)
            res.send(result)
        });
    });
})

module.exports = route;