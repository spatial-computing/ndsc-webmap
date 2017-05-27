var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');
var http = require("http");
var fs = require("fs");
var express = require("express");
var app = express();
var dataset_main, dataset_carousel, dataset_region, dataset_neighborhood, dataset_metadata;
var dataset_variables, dataset_composite, dataset_policy, dataset_other, sheet;

app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });

// Create a document object using the ID of the spreadsheet - obtained from its URL.
var main = new GoogleSpreadsheet('11vMqgUPstD719l0_IFN1RROP23QhX_a-gPkdiObgGN0');
// Authenticate with the Google Spreadsheets API.
main.useServiceAccountAuth(creds, function (err) {
// Get all of the rows from the spreadsheet.
main.getRows(1, function (err, rows) {
    dataset_main=rows;
  });
main.getRows(2, function (err, rows) {
    dataset_carousel=rows;
  });
main.getRows(3, function (err, rows) {
    dataset_region=rows;
  });
main.getRows(4, function (err, rows) {
    dataset_neighborhood=rows;
  });
main.getRows(5, function (err, rows) {
    dataset_metadata=rows;
  });
main.getRows(6, function (err, rows) {
    dataset_variables=rows;
  });
main.getRows(7, function (err, rows) {
    dataset_composite=rows;
  });
main.getRows(8, function (err, rows) {
    dataset_policy=rows;
  });
main.getRows(9, function (err, rows) {
    dataset_other=rows;
  });
});

app.get("/GS-Main",function(req,res){
  res.json({"data":dataset_main});
});
app.get("/GS-Carousel",function(req,res){
  res.json({"data":dataset_carousel});
});
app.get("/GS-Region",function(req,res){
  res.json({"data":dataset_region});
});
app.get("/GS-Neighborhood",function(req,res){
  res.json({"data":dataset_neighborhood});
});
app.get("/GS-Metadata",function(req,res){
  res.json({"data":dataset_metadata});
});
app.get("/GS-Variables",function(req,res){
  res.json({"data":dataset_variables});
});
app.get("/GS-Composite",function(req,res){
  res.json({"data":dataset_composite});
});
app.get("/GS-Policy",function(req,res){
  res.json({"data":dataset_policy});
});
app.get("/GS-Other",function(req,res){
  res.json({"data":dataset_other});
});

app.listen(3000);
