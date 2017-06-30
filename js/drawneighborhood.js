'use strict';

angular.module('myModule', ['angular.filter','esri.map'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

    var map2;
      $scope.mapFlag = 0;

      $http({
            method: 'GET',
            url: 'http://localhost:3000/GS-Main'
        }).then(function (response) {
            $scope.main = response.data.data;
          });


                      $http({
                          method: 'GET',
                          url: 'http://localhost:3000/GS-Variables'
                      }).then(function (response) {
                          $scope.variables = response.data.data;
                        });

      //get the data from region spreadsheet
      $http({
            method: 'GET',
            url: 'http://localhost:3000/GS-Region'
      }).then(function (response){
            $scope.regionData = response.data.data;
      });



$scope.onMapLoad = function(map) {

esriLoader.require([
              "esri/map",
"esri/geometry/Extent",
"esri/layers/FeatureLayer",
"esri/symbols/SimpleLineSymbol",
"esri/symbols/SimpleFillSymbol",
"esri/symbols/TextSymbol",
"esri/renderers/SimpleRenderer",
"esri/layers/LabelClass",
"dojo/_base/Color",
"esri/graphic",
"esri/lang",
"esri/tasks/QueryTask",
"esri/tasks/query",
"esri/symbols/CartographicLineSymbol",
"esri/toolbars/draw",
'esri/symbols/PictureFillSymbol',
"esri/geometry/webMercatorUtils",
"dojo/domReady!"
], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, QueryTask, Query, CartographicLineSymbol, Draw, PictureFillSymbol, webMercatorUtils) {

//Setting labels for map
var labelField = "Name";
//var statesColor = new Color("#191165");
var statesColor = new Color("#ffffff");
var statesLine = new SimpleLineSymbol("solid", statesColor, 1.5);
var statesSymbol = new SimpleFillSymbol("solid", statesLine, null);
var statesRenderer = new SimpleRenderer(statesSymbol);

var statesUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";

var info = new esri.InfoTemplate();
info.setTitle("Neighborhood");
info.setContent("${name}");

var states = new FeatureLayer(statesUrl, {
id: "states",
outFields: ["*"],
infoTemplate: info,
});
var statesLabel = new TextSymbol().setColor(statesColor);
statesLabel.font.setSize("9pt");
statesLabel.font.setFamily("arial");
var json = {
  "labelExpressionInfo": {"value": "{name}"}
};

var labelClass = new LabelClass(json);
labelClass.symbol = statesLabel; // symbol also can be set in LabelClass' json
//states.setLabelingInfo([ labelClass ]);

var symbol = new SimpleFillSymbol(
    SimpleFillSymbol.STYLE_SOLID,
    new SimpleLineSymbol(
      SimpleLineSymbol.STYLE_SOLID,
      new Color([0,112,255,255]),
      2), new Color([173,216,230]));

states.setRenderer(new SimpleRenderer(symbol));

map.removeLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/0");
map.addLayer(states);


//create highlight symbol for hover
var highlightSymbol = new SimpleFillSymbol(
  SimpleFillSymbol.STYLE_SOLID,
  new SimpleLineSymbol(
    SimpleLineSymbol.STYLE_SOLID,
    new Color("#191165"), 1
  ), new Color([ 0, 197, 255]));

map.on("load", function(){
  map.graphics.enableMouseEvents();
});

//get region selected on click
var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0");
var query = new esri.tasks.Query();
query.returnGeometry = true;
query.outFields = ["name"];

var tb;

var lineSymbol = new CartographicLineSymbol(
                    CartographicLineSymbol.STYLE_SOLID,
                    new Color([255, 0, 0]), 5,
                    CartographicLineSymbol.CAP_ROUND,
                    CartographicLineSymbol.JOIN_MITER, 5
                );

                var fillSymbol = new SimpleFillSymbol(
                  SimpleFillSymbol.STYLE_SOLID,
                  new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([255,0,0]), 2
                  ), new Color([255,0,0,0.15]));

function initToolbar(mapObj) {

    map = mapObj;
    tb = new Draw(map);
    tb.on('draw-complete', function(e) {
    addGraphic(e);

  });
  // set the active tool once a button is clicked
  $scope.activateDrawTool = activateDrawTool;
}

function activateDrawTool(tool) {
    //alert("Free-hand drawing is enabled. Please draw the boundaries for your custom neighborhood and then click Explore Neighborhood button.");
    map.disableMapNavigation();
    //map.disableMouseEvents();
    //states.disableMouseEvents();
    tb.activate(tool.toLowerCase());
}

function addGraphic(evt) {
//deactivate the toolbar and clear existing graphics
var symbol = fillSymbol;

map.graphics.add(new Graphic(evt.geometry, symbol));

tb.deactivate();

$scope.geom = evt.geometry;

}

// bind the toolbar to the map
initToolbar(map);

$scope.clearMap = function(){
  map.graphics.remove(map.graphics.graphics[map.graphics.graphics.length - 1]);
  $("#drawButton").removeClass("activeButton");
  $("#drawButton").text("Click here to start drawing!");
}

$scope.goToMap = function(){

  //console.log($scope.results);

  sessionStorage.var = JSON.stringify("Median Household Income");
  sessionStorage.varURL = JSON.stringify("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Income_MedianHouseholdIncome_2015_NDSC/FeatureServer/0");

  $('#mapCarousel').carousel('next');
  $scope.myneighborhoodMap();


}

    }); //esriLoader ends

  }; //onMapLoad ends






















var ext;
//second map and chart page
$scope.myneighborhoodMap = function() {


  esriLoader.require([
    "esri/map",
"esri/geometry/Extent",
"esri/layers/FeatureLayer",
"esri/symbols/SimpleLineSymbol",
"esri/symbols/SimpleFillSymbol",
"esri/symbols/TextSymbol",
"esri/renderers/SimpleRenderer",
"esri/layers/LabelClass",
"dojo/_base/Color",
"esri/graphic",
"esri/lang",
"esri/tasks/query",
"esri/tasks/QueryTask",
"esri/geometry/Polygon",
"esri/dijit/Legend",
"dojo/_base/array",
"dojo/parser",
"esri/geometry/webMercatorUtils",
"dojo/domReady!"
], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, Query, QueryTask, Polygon, Legend,
arrayUtils, parser, webMercatorUtils) {
  parser.parse();

  $scope.sum = 0;
  $scope.variable = JSON.parse(sessionStorage.var);
  $scope.mapUrl = JSON.parse(sessionStorage.varURL);

  $scope.varMapDash = $filter('filter')($scope.variables, { variable: $scope.variable });
  //$scope.sliderYear = JSON.parse(sessionStorage.mymapYear);

  var queryTask = new QueryTask($scope.mapUrl);
  var query = new Query();
  query.returnGeometry = true;
  query.outFields = [
    "*"
  ];


  var polygonExtent = new Extent();
  polygonExtent.xmin = -118.953532;
  polygonExtent.ymin = 32.792291;
  polygonExtent.xmax = -117.644108;
  polygonExtent.ymax = 34.823016;
  var varFilter = $filter('filter')($scope.variables, { variable: $scope.variable});
  var queryTaskmedian = new QueryTask($scope.mapUrl);
  var querymedian = new Query();
  var medianItems = [];
  querymedian.geometry = polygonExtent;
  querymedian.outFields = ["*"];
  queryTaskmedian.execute(querymedian, function(result) {
     for (var i = 0; i < result.features.length; i++) {
       medianItems.push(result.features[i].attributes[varFilter[0].fieldname]);
      }
       medianItems.sort(function(a, b){return a-b});
       $scope.median = medianItems[(medianItems.length)/2];
    });


    query.geometry = $scope.geom;
    queryTask.execute(query, function(results){
      //console.log(results);

      var count = 0;
      var select = 0;
      var resultItems = [];
      var sum=0;
      var resultCount = results.features.length;
      for (var i = 0; i < resultCount; i++) {
        var featureAttributes = results.features[i].attributes;
        for (var attr in featureAttributes) {
          resultItems.push(featureAttributes[attr]);
          count++;
          if (select == 0 && attr == $scope.varMapDash[0].fieldname) {
            select = count;
          }
        }
      }
      for (var i = (select-1); i < resultItems.length; i+=(count/results.features.length)) {
        $scope.sum += resultItems[i];
      }
      if ($scope.varMapDash[0].fieldtype == "total") {
        $scope.tableAnswer = $scope.sum;
      }
      else if($scope.varMapDash[0].fieldtype == "percentage") {
        $scope.tableAnswer = (Math.round(($scope.sum/results.features.length) * 100) / 100) + " %" ;
      }
      else if($scope.varMapDash[0].fieldtype == "income") {
        $scope.tableAnswer = "$ " + (Math.round(($scope.sum/results.features.length) * 100) / 100);
      }

  }).then(function(){
      //console.log($scope.sum);

  var url = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";
  //var url2 = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0";
  var info = new esri.InfoTemplate();
  info.setTitle("Neighborhood");
  info.setContent("${name}");

  var mapLayer = new FeatureLayer(url, {
                  id: "regionMap",
                  outFields: ["*"],
                  // infoTemplate: info
                  });

  var featureLayer = new FeatureLayer($scope.mapUrl);

  map2 = new Map("map2", {
                basemap: "gray",
                center: [-118.2437, 34.2522],
                // center: [6467871.773, 1854546.687],
                zoom: 9,
                showLabels : true,
                });

  map2.on("layers-add-result", function (evt) {
    var layerInfo = arrayUtils.map(evt.layers, function (layer, index) {
      return {layer:layer.layer, title:"Map Legend"};
    });
    if (layerInfo.length > 0) {
      var legendDijit = new Legend({
        map: map2,
        layerInfos: layerInfo
      }, "legendDiv");
      legendDijit.startup();
    }
  });

  //map2.addLayer(featureLayer);
  map2.addLayer(mapLayer);

var highlightSymbol = new SimpleFillSymbol(
  SimpleFillSymbol.STYLE_SOLID,
  new SimpleLineSymbol(
    SimpleLineSymbol.STYLE_SOLID,
    new Color([255,0,0]), 2
  ), new Color([255,0,0,0.15]));


map2.on("load", function(){
map2.graphics.enableMouseEvents();

// var highlightGraphic = new Graphic($scope.geom,highlightSymbol);
// map2.graphics.add(highlightGraphic);


$scope.newGeometry = webMercatorUtils.webMercatorToGeographic($scope.geom);
ext = $scope.newGeometry.getExtent();

var polygonExtent = new Extent();
polygonExtent.xmin = ext.xmin;
polygonExtent.ymin = ext.ymin;
polygonExtent.xmax = ext.xmax;
polygonExtent.ymax = ext.ymax;
//map2.setExtent(polygonExtent);


//Code to highlight census tracts intersecting with drawn polygon

$scope.jsonLink = $scope.mapUrl + "?f=pjson";

var censusQueryTask = new QueryTask($scope.mapUrl);
var censusQuery = new Query();
query.returnGeometry = true;
query.outFields = [
  "*"
];

  $http({
    method: 'GET',
    url: $scope.jsonLink
}).then(function (response) {

      $scope.trial = response.data.drawingInfo.renderer;
      censusQuery.geometry = $scope.geom;
      var symbol;
      var drawGraphic;
      censusQueryTask.execute(query, function(results){
        console.log(results);
        var count = 0;
        var select = 0;
        var resultItems = [];
        var sum=0;
        var resultCount = results.features.length;



        for (var i = 0; i < resultCount; i++) {
          var featureAttributes = results.features[i].attributes;
          for (var attr in featureAttributes) {
            resultItems.push(featureAttributes[attr]);
            count++;
            if (select == 0 && attr == $scope.varMapDash[0].fieldname) {
              select = count;
            }
          }
        }

        var k=0;
        for (var i = (select-1); i < resultItems.length; i+=(count/results.features.length)) {


          for (var j = 1, len = $scope.trial.classBreakInfos.length; j < len; j++){
            if(resultItems[i] >= $scope.trial.classBreakInfos[j-1].classMaxValue && resultItems[i] <= $scope.trial.classBreakInfos[j].classMaxValue){
                console.log($scope.trial.classBreakInfos[j].symbol.color);
                console.log(results.features[k].geometry);
                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color($scope.trial.classBreakInfos[j].symbol.outline.color), 1
                  ), new Color($scope.trial.classBreakInfos[j].symbol.color));

                  drawGraphic = new Graphic(results.features[k].geometry,symbol);
                  map2.graphics.add(drawGraphic);

            }
          }

          k++;

        }
      }).then(function(){
        var highlightGraphic = new Graphic($scope.geom,highlightSymbol);
        map2.graphics.add(highlightGraphic);
      });//queryTask ends




}); //http call



});

//slider code
  var pop = $filter('filter')($scope.main, { variable: $scope.variable });

              if (pop.length!=1) {
                  $scope.max=parseInt(pop[0].year);
                  $scope.min=parseInt(pop[0].year);

                  for (var i = 0; i < pop.length; i++) {
                    if(pop[i].year>$scope.max)$scope.max=pop[i].year;
                    if(pop[i].year<$scope.min)$scope.min=pop[i].year;
                  }
                  $scope.chlistener = function(val) {
                  $scope.lastSliderUpdated = $scope.slider_ticks_values_tooltip.value;
                  var pop1 = $filter('filter')(pop, { year: $scope.lastSliderUpdated});
                  sessionStorage.mapYear =  JSON.stringify($scope.lastSliderUpdated);
                  $scope.newMap(pop1[0]);
                  };
                  --$scope.min;
                  ++$scope.min;
                  $scope.slider_ticks_values_tooltip = {
                           value: $scope.sliderYear,
                           options: {
                               ceil: $scope.max,
                               floor: $scope.min,
                               showTicksValues: true,
                               onChange: $scope.chlistener
                           }
                       };
                $scope.bool=true;
              }
              else {
                $scope.bool=false;

              }



  $scope.newMap = function(topic){
    $scope.mapdata = topic;
    sessionStorage.var = JSON.stringify(topic.variable);
    sessionStorage.varURL = JSON.stringify(topic["feature-serviceurl"]);
    sessionStorage.mapYear =  JSON.stringify($scope.lastSliderUpdated);
    $window.location.reload();
  };

//chart code
$scope.url = $scope.mapUrl;
$scope.jsonUrl = $scope.mapUrl + "?f=pjson";
//console.log($scope.jsonUrl);
  $http({
    method: 'GET',
    url: $scope.jsonUrl
}).then(function (response) {

    $scope.trial = response.data.drawingInfo.renderer;
    //console.log($scope.trial);
    var groupByExpression = "CASE ";
    var arr = $scope.trial.classBreakInfos;
    groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " < 0 OR "+$scope.trial.field+ " IS NULL THEN 'No Data' ";
    for (var i = 1, len = $scope.trial.classBreakInfos.length; i < len; i++)
    {
       groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " BETWEEN "+$scope.trial.classBreakInfos[i-1].classMaxValue+" AND "+$scope.trial.classBreakInfos[i].classMaxValue+" THEN '"+$scope.trial.classBreakInfos[i].label+"' ";
    }
    groupByExpression = groupByExpression + " END";
    //console.log(groupByExpression);

    var box = ext.xmin + ',' + ext.xmax + ',' + ext.ymin + ',' + ext.ymax;


    var chart = new Cedar({
      "type":"bar",
      "dataset":{
        "url":$scope.url,
        "query":{
          "groupByFieldsForStatistics": groupByExpression,
          "orderByFields": groupByExpression,
          "outStatistics": [{
            "statisticType": "count",
            "onStatisticField": $scope.trial.field,
            "outStatisticFieldName": "RangeCount",
          }],
          "bbox": box,
          "inSR": "102100"
        },
        "mappings":{
          "x": {"field":"EXPR_1","label":"Range"},
          "y": {"field":"RangeCount","label":"Count"},
          // "label": {"field":"EXPR_1","label":"Range"},
          // "color": {"field":"EXPR_1","label":"Range"}
        }
      }
    });
    chart.show({
      elementId: "#chart",
      autolabels: true
    });
    chart.transform = function (queryResult, dataset) {
      var features = queryResult.features;
      var index = -1;
      for (var i = 0, len = features.length; i < len; i++) {
        if(features[i].attributes.EXPR_1==null){
          index = i;
          break;
        }
      }
      if(index>-1){
        features = features.splice(index,1);
      }
      return queryResult;
    };
},function(err){
    console.log(err);
});


  });

  });

}

});//angular controller ends
