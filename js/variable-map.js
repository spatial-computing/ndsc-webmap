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
                    $scope.main = response.data.data;


              var pop = $filter('filter')($scope.main, { variable: $scope.mapData["variable"] });

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

            },function(err){
                console.log(err);
                });


			// $http({
      //               method: 'GET',
      //               url: 'http://localhost:3000/ndsc3'
      //           }).then(function (response) {
			// 	$scope.about = response.data.data;});

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
map.on("click", function(evt){
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
      var count = 0;
      var select = 0;

      var resultItems = [];
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




          //chart code
          $scope.url = $scope.mapData["feature-serviceurl"] + "/0";
          $scope.jsonUrl = $scope.mapData["feature-serviceurl"] + "/0?f=pjson";

            $http({
              method: 'GET',
              url: $scope.jsonUrl
          }).then(function (response) {
              $scope.trial = response.data.drawingInfo.renderer;
              var groupByExpression = "CASE ";
              var arr = $scope.trial.classBreakInfos;
              groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " < 0 OR "+$scope.trial.field+ " IS NULL THEN 'No Data' ";
              for (var i = 1, len = $scope.trial.classBreakInfos.length; i < len; i++)
              {
                 groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " BETWEEN "+$scope.trial.classBreakInfos[i-1].classMaxValue+" AND "+$scope.trial.classBreakInfos[i].classMaxValue+" THEN '"+$scope.trial.classBreakInfos[i].label+"' ";
              }
              groupByExpression = groupByExpression + " END";
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
