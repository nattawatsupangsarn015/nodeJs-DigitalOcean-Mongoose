const _ = require('lodash');
const express = require('express');
const route = express.Router()
const crypto = require('crypto')

//---------------------------------- set database ----------------------------------//

var mongoose = require('mongoose'); //Call mongoose
var itemModel = require('../../model/itemModel.js'); //Call Schema of itemModel
var imageModel = require('../../model/imageModel.js'); //Call Schema of imageModel
var userModel = require('../../model/userModel.js'); //Call Schema of userModel
var db = mongoose.connection; //Create mongoDB connection

//---------------------------------- set up upload  ----------------------------------//

const AWS = require('aws-sdk')
const spacesEndpoint = new AWS.Endpoint('Your end point url'); //create endpoint
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: 'access key id',
    secretAccessKey: 'secret access key'
});


//---------------------------------- image management ----------------------------------//
var multer  = require('multer');
var multerS3 = require('multer-s3')

//create storage setting
var multerS3Config = multerS3({
    s3: s3,
    bucket: 'your unique bucket name',
    acl: 'public-read',
    key: function (req, file, cb) {
        //create image's name for keep in image cloud
        cb(null,  req.params.id + '/' + new Date().getTime() + '-' + file.originalname)
    }
});

var fileFilter = (req, file, cb) => { 
    //filter type of image to upload
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

//------- upload image ---------//

var upload = multer({
    storage: multerS3Config,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 2 } //filter size of image to upload (This case limited 2 MB.)
})

//---------------------------------- auth management ----------------------------------//
const jwt = require("jwt-simple");
const passport = require("passport");

//use for decode jwt
const ExtractJwt = require("passport-jwt").ExtractJwt;

//use for call Strategy
const JwtStrategy = require("passport-jwt").Strategy;

//create your secert for encoder jwt
const SECRET = "SECERT CODE"; 

//create Strategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader("authorization"),
    secretOrKey: SECRET
};

const jwtAuth = new JwtStrategy(jwtOptions, (user, done) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        userModel.find( (err, result) => {
            if (err) return console.error(err);
            var checkData = _.find(result, {username: user.username}); // check username for login
            if (checkData && (new Date().getTime() < user.exp)) done(null, true); // check sessions time out
            else done(null, false);
        });
    });
});

passport.use(jwtAuth);

// Passport Middleware
const requireJWTAuth = passport.authenticate("jwt",{session:false});

// Middleware for call JWT
const loginMiddleWare = (req, res, next) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    //create password to check in DB with md5 + salt data for secure password
    const password = crypto.createHash('md5').update(req.body.password).digest("hex") + crypto.createHash('md5').update(SECRET).digest("hex")

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        userModel.find( (err, result) => {
            if (err) return console.error(err);
            // check username and password
            var checkData = _.find(result, {username: req.body.username, password: crypto.createHash('md5').update(password).digest("hex")});
            if(checkData){
                //create payload to client
                const payload = {
                    username: req.body.username,
                    exp: new Date().getTime() + 86400000
                };
                res.status(200).send(jwt.encode(payload, SECRET)); //encode to jwt
            }
            else res.status(401).send("Wrong username and password");
        });
    });
};

//---------------------------------- Create Api ----------------------------------//

//login and return
route.post("/login", loginMiddleWare, (req, res) => {
    res.send("Login success!")
})

//register user
route.post("/registerUser", (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    //encoder password
    const password = crypto.createHash('md5').update(req.body.password).digest("hex") + crypto.createHash('md5').update(SECRET).digest("hex")

    var user = new userModel({
        username: req.body.username,
        password: crypto.createHash('md5').update(password).digest("hex")
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        userModel.find( (err, result) => {
            if (err) return console.error(err);
            var checkDuplicate = _.find(result, {username: user.username}); //check duplicate username
            if(checkDuplicate) return res.status(500).send("Your username is already have in database.")
            else {
                //create user in DB
                userModel.create(user, (err, result) => {
                    if(err) return console.log(err)
                    res.status(201).send("Created user success!");
                });
            }
        });
    });
});


//post item with authen
route.post('/item', requireJWTAuth, (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })
    
    var item = new itemModel({
        code: req.body.code,
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        bestSeller: req.body.bestSeller,
        price: req.body.price
    })
    
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        itemModel.find((err, result) => {
            if(err) return console.log(err)
            if(result.find(data => data.code === item.code)) {
                res.status(400).send('This code already in database.')
            }
            else {
                itemModel.create(item, (err, result) => {
                    if(err) return console.log(err)
                    res.status(201).send(result)
                });
            }
        });
    });

})

//get data from DB with authen
route.get('/items', requireJWTAuth, (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        itemModel.find( (err, result) => {
            if (err) return console.error(err);
            res.send(result)
        });
    });
})

//get data in DB by id ( Single fetch )
route.get('/item/:id', requireJWTAuth, (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        itemModel.find( (err, result) => {
            if (err) return console.error(err);
            res.send(result.find(item => item.id === req.params.id))
        });
    });
})

//universal search with moongoose framework
route.get('/item/search/:id', requireJWTAuth, (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    var sendData = []

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        //type is mean your variable in your database. This case use 'type'
        itemModel.find({type : {$regex: new RegExp("^" + req.params.id.toLowerCase(), "i") }}, (err, result) => {
            if (err) return console.error(err);
            sendData = result
            if(sendData.length !== 0) {
                res.send(sendData)
            }
            else {
                res.status(404).send('Data not found.')
            }
        });
    });
})

//Put ( edit ) single data with authen
route.put('/item/:id', requireJWTAuth, (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    //data for edit
    var item = {
        code: req.body.code,
        name: req.body.name,
        type: req.body.type,
        price: req.body.price,
        description: req.body.description,
        bestSeller: req.body.bestSeller
    }

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        itemModel.findOneAndUpdate({_id: req.params.id}, item, (err, result) => {
            if(err) return res.send(err)
            res.send(result)
        })  
    });
})


//Delete single data with authen
route.delete('/item/:id', requireJWTAuth, (req, res, next) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {

        //delete child data in DB
        imageModel.deleteMany({ productId: req.params.id }, (err, result) => {
            if(err) return res.send(err)
        });
    });

    db.once('open', () => {

        //delete parent data in DB
        itemModel.deleteOne({ _id: req.params.id }, (err, result) => {
            if(err) return res.send(err)
        });
    });

    //Use deleteAllImage function for next step
    next()

    res.status(200).send('Delete product success!') //Return status
},deleteAllImage)


//Insert child data in DB and Upload image
// This case 'productImage' is my key of image to receive (ex. {productImage: 'image data'})
route.put('/image/:id', requireJWTAuth, upload.single('productImage'), (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    const keyImage = req.file.key.split("/") //just my name of img in cloud

    const image = new imageModel({
        productId: req.params.id,
        imageName: req.file.originalname,
        imagePath: req.file.location,
        key: keyImage[1],
        selectCover: false
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {

        //insert child data to DB (it's not edit data, it's insert data. ***)
        itemModel.updateOne({_id: req.params.id }, {
            $push : {
                'imageData' : image
            }
        },(err, result) => {
            res.send(result)
        });
    });
});

//get child data
route.get('/item/images/:id', requireJWTAuth, function(req,res,next){
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {

        itemModel.findOne({_id: req.params.id}, (err, result) => {
            if (err) return console.error(err);
            res.send(result)
        });
    });
});


//edit child data in DB
route.put('/item/images/:id', requireJWTAuth, (req, res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })
    

    const image = req.body.data

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        //find unique id for edit child data
        itemModel.updateOne({_id: req.params.id }, {
            $set : {
                'imageData' : image
            }
        },(err, result) => {
            res.send(result)
        });
    });
}) 

//delete child data in DB and delete image in cloud
route.delete('/images/:idProduct&:idImage&:key', (req,res) => {
    mongoose.connect('mongodb://yourDBurl:port/dbName', {
        "user": "username",
        "pass": "password",
        "useNewUrlParser": true
    })

    const image = imageModel({
        _id: req.params.idImage,
        key: req.params.key,
        productId: req.params.idProduct
    }) 

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {

        //find unique id for delete 
        itemModel.updateOne({_id: req.params.idProduct }, {
            $pull : {
                'imageData': image
            }
        },(err, result) => {
            if(err) console.log(err)
            else {
                //set location in image cloud
                var params = {
                    Bucket: 'your unique name',
                    Key: req.params.idProduct + '/' + req.params.key //location in cloud (ex. directory/image.png or image.png)
                };

                //delete image in cloud
                //s3 is call on top page
                s3.deleteObject(params, function (err, data) {
                    if(err) console.log(err)
                    res.send(result)
                });
            }
        });
    });
})


//function to delete all image
async function deleteAllImage(req, res){
    const listParams = {
        Bucket: 'your unique bucket name',
        Prefix: req.params.id //your folder to delete (ex. your image.png in directory/image.png ,so just 'directory')
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {
        Bucket: 'your unique bucket name',
        Delete: { Objects: [] }
    };

    //check for delete image
    listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
    });

    await s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await emptyS3Directory('your unique bucket name', req.params.id);
}

module.exports = route;