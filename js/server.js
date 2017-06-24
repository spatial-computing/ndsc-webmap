var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');
var http = require("http");
var fs = require("fs");
var express = require("express");
var app = express();
var dataset_main, dataset_carousel, dataset_region, dataset_neighborhood, dataset_datasets;
var dataset_variables, dataset_composite, dataset_policy, dataset_tooltips, dataset_about;

app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });

// Create a document object using the ID of the spreadsheet - obtained from its URL.
var main = new GoogleSpreadsheet('11vMqgUPstD719l0_IFN1RROP23QhX_a-gPkdiObgGN0');

app.get("/GS-Main",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(1, function (err, rows) {
      dataset_main=rows;
    });
  });
  res.json({"data":dataset_main});
});
app.get("/GS-Carousel",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(2, function (err, rows) {
        dataset_carousel=rows;
    });
  });
  res.json({"data":dataset_carousel});
});
app.get("/GS-Region",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(3, function (err, rows) {
        dataset_region=rows;
    });
  });
  res.json({"data":dataset_region});
});
app.get("/GS-Neighborhood",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(4, function (err, rows) {
        dataset_neighborhood=rows;
    });
  });
  res.json({"data":dataset_neighborhood});
});
app.get("/GS-Datasets",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(5, function (err, rows) {
        dataset_datasets=rows;
    });
  });
  res.json({"data":dataset_datasets});
});
app.get("/GS-Variables",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(6, function (err, rows) {
        dataset_variables=rows;
    });
  });
  res.json({"data":dataset_variables});
});
app.get("/GS-Composite",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(7, function (err, rows) {
        dataset_composite=rows;
    });
  });
  res.json({"data":dataset_composite});
});
app.get("/GS-Policy",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(8, function (err, rows) {
        dataset_policy=rows;
    });
  });
  res.json({"data":dataset_policy});
});
app.get("/GS-Tooltips",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(9, function (err, rows) {
        dataset_tooltips=rows;
    });
  });
  res.json({"data":dataset_tooltips});
});
app.get("/GS-About",function(req,res){
  main.useServiceAccountAuth(creds, function (err) {
    main.getRows(10, function (err, rows) {
        dataset_about=rows;
    });
  });
  res.json({"data":dataset_about});
});

app.listen(3000);
