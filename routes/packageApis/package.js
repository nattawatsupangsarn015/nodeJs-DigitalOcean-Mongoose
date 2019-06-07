const express = require('express');
const route = express.Router()

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