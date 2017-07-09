'use strict';

angular.module('myModule', ['angular.filter','esri.map', 'rzModule', 'ui.bootstrap'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

      $scope.mapData = JSON.parse(sessionStorage.mapStore);
      $scope.sliderYear = JSON.parse(sessionStorage.mapYear);
      $scope.mapUrl = $scope.mapData["feature-serviceurl"] + "/0";

      $scope.bool=true;

                $http({
                    method: 'GET',
                    url: 'http://localhost:3000/GS-Variables'
                }).then(function (response) {
                    $scope.variables = response.data.data;
                    $scope.varMapDash = $filter('filter')($scope.variables, { variable: $scope.mapData["variable"] });

                    esriLoader.require([
                        "esri/map",
                        "esri/geometry/Extent",
                        "esri/tasks/query",
                        "esri/tasks/QueryTask",
                        "dojo/domReady!"
                      ], function(Map, Extent, Query, QueryTask) {

                        //Code to find the median value for LA county
                          var polygonExtent = new Extent();
                          polygonExtent.xmin = -118.953532;
                          polygonExtent.ymin = 32.792291;
                          polygonExtent.xmax = -117.644108;
                          polygonExtent.ymax = 34.823016;
                          var queryTaskmedian = new QueryTask($scope.mapUrl);
                          var querymedian = new Query();
                          var medianItems = [];
                          querymedian.geometry = polygonExtent;
                          querymedian.outFields = ["*"];
                          queryTaskmedian.execute(querymedian, function(result) {
                            console.log(result);
                          for (var i = 0; i < result.features.length; i++) {
                            if(result.features[i].attributes[$scope.varMapDash[0].fieldname] != -9999)
                              medianItems.push(result.features[i].attributes[$scope.varMapDash[0].fieldname]);
                          }
                          medianItems.sort(function(a, b){return a-b});
                          if (medianItems.length % 2) {
                            $scope.median = medianItems[(1 + medianItems.length)/2];
                          }
                          else {
                            $scope.median = (medianItems[(medianItems.length)/2] + medianItems[((medianItems.length)/2)+1])/2;
                          }
                          $scope.median = Math.round($scope.median * 100) / 100;
                          $scope.$apply();
                        });
                      });

                  });

                  $http({
                      method: 'GET',
                      url: 'http://localhost:3000/GS-Region'
                  }).then(function (response) {
                      $scope.regionData = response.data.data;
                    });



                $http({
                    method: 'GET',
                    url: 'http://localhost:3000/GS-Main'
                }).then(function (response) {

                  $scope.values = [];
                  $scope.years = [];

                  esriLoader.require([
                      "esri/map",
                      "esri/geometry/Extent",
                      "esri/tasks/query",
                      "esri/tasks/QueryTask",
                      "dojo/domReady!"
                    ], function(Map, Extent, Query, QueryTask) {

                    $scope.main = response.data.data;


              var pop = $filter('filter')($scope.main, { variable: $scope.mapData["variable"] });
              var featureUrls = [];
              if (pop.length!=1) {
                  $scope.max=parseInt(pop[0].year);
                  $scope.min=parseInt(pop[0].year);

                  for (var i = 0; i < pop.length; i++) {
                    if(pop[i].year>$scope.max)$scope.max=pop[i].year;
                    if(pop[i].year<$scope.min)$scope.min=pop[i].year;
                    $scope.years.push(pop[i].year);
                    featureUrls.push(pop[i]["feature-serviceurl"] + "/0");
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
                $scope.years.push(pop[0].year);
                featureUrls.push(pop[0]["feature-serviceurl"] + "/0");
              }
              $scope.years.reverse();
              featureUrls.reverse();

              var polygonExtent = new Extent();
              polygonExtent.xmin = -118.953532;
              polygonExtent.ymin = 32.792291;
              polygonExtent.xmax = -117.644108;
              polygonExtent.ymax = 34.823016;

              var queryTaskchart = new QueryTask(featureUrls[0]);
              var querychart = new Query();
              var callsRemaining = featureUrls.length;
              var min;

              for(var j = 0; j < featureUrls.length; j++){
                  console.log(featureUrls[j]);

                  queryTaskchart = new QueryTask(featureUrls[j]);
                  querychart = new Query();
                  var medianItems = [];
                  querychart.geometry = polygonExtent;
                  querychart.outFields = ["*"];

                  queryTaskchart.execute(querychart, function(result) {

                  for (var i = 0; i < result.features.length; i++) {
                    if(result.features[i].attributes[$scope.varMapDash[0].fieldname] != -9999)
                      medianItems.push(result.features[i].attributes[$scope.varMapDash[0].fieldname]);
                  }
                  medianItems.sort(function(a, b){return a-b});
                  if (medianItems.length % 2) {
                    $scope.median = medianItems[(1 + medianItems.length)/2];
                  }
                  else {
                    $scope.median = (medianItems[(medianItems.length)/2] + medianItems[((medianItems.length)/2)+1])/2;
                  }
                  $scope.median = Math.round($scope.median * 100) / 100;
                  $scope.values.push($scope.median);
                  if(min == null){
                  min = $scope.median;
                }
                if($scope.median < min){
                    min = $scope.median;
                  }
                  --callsRemaining;
                  if(callsRemaining <= 0){
                    console.log($scope.values);
                    console.log(min);
                    var ctx = document.getElementById("chart").getContext('2d');
                    var myChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: $scope.years,
                            datasets: [{
                                label: $scope.mapData["variable"],
                                data: $scope.values,
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.2)',
                                    'rgba(54, 162, 235, 0.2)',
                                    'rgba(255, 206, 86, 0.2)',
                                    'rgba(75, 192, 192, 0.2)',
                                    'rgba(153, 102, 255, 0.2)',
                                    'rgba(255, 159, 64, 0.2)'
                                ],
                                borderColor: [
                                    'rgba(255,99,132,1)',
                                    'rgba(54, 162, 235, 1)',
                                    'rgba(255, 206, 86, 1)',
                                    'rgba(75, 192, 192, 1)',
                                    'rgba(153, 102, 255, 1)',
                                    'rgba(255, 159, 64, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero:true,
                                        min: Math.max(0,Math.round(min-100)),
                                        stepSize: min/2
                                    }
                                }]
                            }
                        }
                    });

                  }
                });
              }

            });//esriLoader finishes


            },function(err){
                console.log(err);
                });


                $scope.newMap = function(topic){
                  $scope.mapdata = topic;
                  sessionStorage.mapStore =  JSON.stringify($scope.mapdata);
                  $window.location.reload();
                };






        $scope.onMapLoad = function(map) {



            // this example requires other Esri modules like graphics, symbols, and toolbars
            // so we load them up front using the esriLoader
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
"esri/dijit/Legend",
"dojo/_base/array",
"dojo/parser",
"esri/tasks/query",
"esri/tasks/QueryTask",
"dojo/domReady!"
], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, Legend,
arrayUtils, parser, Query, QueryTask) {

  // load the map centered on the United States
parser.parse();

var queryTask0 = new QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0");
var query0 = new Query();
query0.returnGeometry = true;
    query0.outFields = ["*"];
var query = new Query();
    query.returnGeometry = true;
    query.outFields = ["*"];
    var queryTask2 = new QueryTask($scope.mapUrl);
    var query2 = new Query();
    query2.returnGeometry = true;
    query2.outFields = ["*"];

var labelField = "name";

// create a renderer for the states layer to override default symbology
var statesColor = new Color("#FF3300");
var statesLine = new SimpleLineSymbol("solid", statesColor, 1.5);
var statesSymbol = new SimpleFillSymbol("solid", statesLine, null);
var statesRenderer = new SimpleRenderer(statesSymbol);
// create a feature layer to show country boundaries
var statesUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";
//var statesUrl = $scope.mapData["Feature-service URL"] + "/0";
var waterbodies = new FeatureLayer($scope.mapUrl, {
        mode: FeatureLayer.MODE_ONDEMAND,
        outFields: ["*"]
      });
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
//create instance of LabelClass (note: multiple LabelClasses can also be passed in as an array)
var labelClass = new LabelClass(json);
labelClass.symbol = statesLabel; // symbol also can be set in LabelClass' json
map.on("layers-add-result", function (evt) {
  var layerInfo = arrayUtils.map(evt.layers, function (layer, index) {
    return {layer:layer.layer, title:"Map Legend"};
  });
  if (layerInfo.length > 0) {
    var legendDijit = new Legend({
      map: map,
      layerInfos: layerInfo
    }, "legendDiv");
    legendDijit.startup();
  }
});
//states.setLabelingInfo([ labelClass ]);
map.addLayers([waterbodies,states]);

var highlightSymbol = new SimpleFillSymbol(
  SimpleFillSymbol.STYLE_SOLID,
  new SimpleLineSymbol(
    SimpleLineSymbol.STYLE_SOLID,
    new Color("#191165"), 1
  ), new Color([255,0,0,0.5]));


map.on("load", function(){
  map.graphics.enableMouseEvents();
});

map.graphics.on("mouse-out", function() {
map.graphics.clear();
map.infoWindow.hide();
});

states.on("mouse-over", function(evt){
  var t = "<b>${name}</b>";
  var content = esriLang.substitute(evt.graphic.attributes,t);
  var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
  map.graphics.add(highlightGraphic);
  map.infoWindow.setContent(content);
  map.infoWindow.setTitle("Neighborhood");
  map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
});

$scope.table = "false";
$scope.exploreRegion = "false";
map.on("click", function(evt){

  $scope.exploreRegion = "true";
  $scope.table = "true";

    query0.geometry = evt.mapPoint;
    queryTask0.execute(query0, function(result) {
      $scope.pick = result.features[0].attributes.name;
      $scope.sum=0;

      query.where = "name = '" + $scope.pick + "'";
      queryTask0.execute(query, function(results) {
        query2.geometry = results.features[0].geometry;
        queryTask2.execute(query2, showResults);
      });
    });

    function showResults (results) {
      var resultItems = [];
      var resultCount = results.features.length;
      for (var i = 0; i < resultCount; i++) {
        var featureAttributes = results.features[i].attributes;
        if(featureAttributes[$scope.varMapDash[0].fieldname] != -9999) {
          resultItems.push(featureAttributes[$scope.varMapDash[0].fieldname]);
        }
      }

      for (var i = 0; i < resultItems.length; i++) {
        $scope.sum += resultItems[i];
      }

      if ($scope.varMapDash[0].fieldtype == "total") {
        $scope.tableAnswer = Math.round($scope.sum * 100) / 100;
      }
      else if($scope.varMapDash[0].fieldtype == "percentage") {
        $scope.tableAnswer = (Math.round(($scope.sum/results.features.length) * 100) / 100) + " %" ;
      }
      else if($scope.varMapDash[0].fieldtype == "income") {
        $scope.tableAnswer = "$ " + (Math.round(($scope.sum/results.features.length) * 100) / 100);
      }
      $scope.$apply();
    }

});

            });

        };



        $scope.dispMenu = function(topic){
          $scope.ds = topic.policyarea;
        }

          $scope.dispSubMenu = function(topic){

            $scope.var = topic.Dataset;
          }


    });
