'use strict';

angular.module('myModule', ['angular.filter','esri.map'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

    var map2;
      $scope.mapFlag = 0;

      //get the data from neighborhood spreadsheet
      // $http({
      //       method: 'GET',
      //       url: 'http://localhost:3000/GS-Neighborhood'
      // }).then(function (response){
      //       $scope.neighborhood = response.data.data;
      // });
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
"dojo/domReady!"
], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, QueryTask, Query, CartographicLineSymbol, Draw, PictureFillSymbol) {

//Setting labels for map
var labelField = "Name";
var statesColor = new Color("#191165");
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
  "labelExpressionInfo": {"value": "{Name}"}
};


var labelClass = new LabelClass(json);
labelClass.symbol = statesLabel;

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

// map.graphics.on("mouse-out", function() {
// map.graphics.clear();
// map.infoWindow.hide();
// });
//
// states.on("mouse-over", function(evt){
//   var t = "<b>${name}</b>";
//   var content = esriLang.substitute(evt.graphic.attributes,t);
//   var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
//   map.graphics.add(highlightGraphic);
//   map.infoWindow.setContent(content);
//   map.infoWindow.setTitle("Neighborhood");
//   map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
// });


//get region selected on click
var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0");
var query = new esri.tasks.Query();
query.returnGeometry = true;
query.outFields = ["name"];

// map.on("click", function(evt){
//     //console.log(evt.graphic);
//     $scope.regionGraphic = evt.graphic;
//     query.geometry = evt.mapPoint;
//     //console.log(evt.mapPoint);
//     queryTask.execute(query, function(result){
//     $scope.regionpick = result.features[0].attributes.Name;
//
//
//     $('#mapCarousel').carousel('next');
//     $scope.regionMap();
//   })
// });


var tb;

var lineSymbol = new CartographicLineSymbol(
                    CartographicLineSymbol.STYLE_SOLID,
                    new Color([255, 0, 0]), 5,
                    CartographicLineSymbol.CAP_ROUND,
                    CartographicLineSymbol.JOIN_MITER, 5
                );

                var fillSymbol = new PictureFillSymbol(
                                    // 'images/mangrove.png',
                                    'http://developers.arcgis.com/javascript/samples/graphics_add/images/mangrove.png',
                                    new SimpleLineSymbol(
                                        SimpleLineSymbol.STYLE_SOLID,
                                        new Color('#000'),
                                        1
                                    ),
                                    42,
                                    42
                                );

function initToolbar(mapObj) {

    map = mapObj;
    tb = new Draw(map);
    tb.on('draw-complete', function(e) {
    // $scope.$apply(function() {
    //   addGraphic(e);
    // });
    //alert(e);
    addGraphic(e);
  });
  // set the active tool once a button is clicked
  $scope.activateDrawTool = activateDrawTool;
}

function activateDrawTool(tool) {
    alert("Free-hand drawing is enabled. Please draw the boundaries for your custom neighborhood and then click Explore Neighborhood button.");
    map.disableMapNavigation();
    tb.activate(tool.toLowerCase());
}

function addGraphic(evt) {
//deactivate the toolbar and clear existing graphics
tb.deactivate();
map.enableMapNavigation();
var symbol = lineSymbol;

map.graphics.add(new Graphic(evt.geometry, symbol));

$scope.geom = evt.geometry;
//console.log($scope.geom);

}

                                              // bind the toolbar to the map
initToolbar(map);

$scope.clearMap = function(){
  map.graphics.remove(map.graphics.graphics[map.graphics.graphics.length - 1]);
}

$scope.goToMap = function(){
  //console.log($scope.geom);

  // var queryTask = new QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Income_MedianHouseholdIncome_2015_NDSC/FeatureServer/0");
  // var query = new Query();
  // query.returnGeometry = true;
  // query.outFields = [
  //   "*"
  // ];
  //
  // // sessionStorage.mynhood =  JSON.stringify($scope.geom);
  // //   var g = JSON.parse(sessionStorage.mynhood);
  // //   var geom = g;
  // //   console.log(geom);
  //   query.geometry = $scope.geom;
  //   queryTask.execute(query, function(results){
  //     //console.log(results);
  //
  //     var resultItems = [];
  //     var sum=0;
  //     var resultCount = results.features.length;
  //     for (var i = 0; i < resultCount; i++) {
  //       var featureAttributes = results.features[i].attributes;
  //       for (var attr in featureAttributes) {
  //         resultItems.push(featureAttributes[attr]);
  //       }
  //     }
  //     for (var i = 2; i < resultItems.length; i+=5) {
  //       sum += resultItems[i];
  //     }
  //     $scope.sum = sum;
  //     console.log(sum);
  // });



  //console.log($scope.results);

  sessionStorage.var = JSON.stringify("Median Household Income");
  sessionStorage.varURL = JSON.stringify("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Income_MedianHouseholdIncome_2015_NDSC/FeatureServer/0");

  $('#mapCarousel').carousel('next');
  $scope.myneighborhoodMap();


}

    }); //esriLoader ends

  }; //onMapLoad ends























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
"dojo/domReady!"
], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, Query, QueryTask, Polygon, Legend,
arrayUtils, parser) {
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

  // sessionStorage.mynhood =  JSON.stringify($scope.geom);
  //   var g = JSON.parse(sessionStorage.mynhood);
  //   var geom = g;
  //   console.log(geom);
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

  var url = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";
  //var url2 = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0";
  var info = new esri.InfoTemplate();
  info.setTitle("Neighborhood");
  info.setContent("${name}");

  var mapLayer = new FeatureLayer(url, {
                  id: "regionMap",
                  outFields: ["*"],
                  infoTemplate: info
                  });

  var featureLayer = new FeatureLayer($scope.mapUrl);

  map2 = new Map("map2", {
                basemap: "gray",
                center: [-118.2437, 34.2522],
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

  map2.addLayer(featureLayer);
  map2.addLayer(mapLayer);

  console.log($scope.geom);

// highlight the drawn neighborhood
// var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(
//                             SimpleLineSymbol.STYLE_SOLID,new Color("#191165"), 1),new Color([ 0, 197, 255, 0.35]));

var highlightSymbol = new SimpleFillSymbol(
  SimpleFillSymbol.STYLE_SOLID,
  new SimpleLineSymbol(
    SimpleLineSymbol.STYLE_SOLID,
    new Color("#191165"), 1
  ), new Color([255,0,0,0.5]));


map2.on("load", function(){
map2.graphics.enableMouseEvents();

var highlightGraphic = new Graphic($scope.geom,highlightSymbol);
map2.graphics.add(highlightGraphic);



});

// map.graphics.on("mouse-out", function() {
// map.graphics.clear();
// map.infoWindow.hide();
// });
//
// states.on("mouse-over", function(evt){
//   var t = "<b>${name}</b>";
//   var content = esriLang.substitute(evt.graphic.attributes,t);
//   var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
//   map.graphics.add(highlightGraphic);
//   map.infoWindow.setContent(content);
//   map.infoWindow.setTitle("Neighborhood");
//   map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
// });

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
console.log($scope.jsonUrl);
  $http({
    method: 'GET',
    url: $scope.jsonUrl
}).then(function (response) {
    $scope.trial = response.data.drawingInfo.renderer;
    console.log($scope.trial);
    var groupByExpression = "CASE ";
    var arr = $scope.trial.classBreakInfos;
    groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " < 0 OR "+$scope.trial.field+ " IS NULL THEN 'No Data' ";
    for (var i = 1, len = $scope.trial.classBreakInfos.length; i < len; i++)
    {
       groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " BETWEEN "+$scope.trial.classBreakInfos[i-1].classMaxValue+" AND "+$scope.trial.classBreakInfos[i].classMaxValue+" THEN '"+$scope.trial.classBreakInfos[i].label+"' ";
    }
    groupByExpression = groupByExpression + " END";
    console.log(groupByExpression);
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
            "outStatisticFieldName": "RangeCount"
          }]
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
