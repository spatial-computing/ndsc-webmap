'use strict';

angular.module('myModule', ['angular.filter','esri.map', 'rzModule', 'ui.bootstrap'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

    //getting the variables stored in sessionStorage
      $scope.nhood = JSON.parse(sessionStorage.nhood);
      $scope.variable = JSON.parse(sessionStorage.variable);
      $scope.mapUrl = JSON.parse(sessionStorage.varUrl);
      $scope.sliderYear = JSON.parse(sessionStorage.mapYear);

      $scope.bool=true; //required for slider


$scope.onMapLoad = function(map) {

      $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Variables'
      }).then(function (response) {
            $scope.variables = response.data.data;
            $scope.varMapDash = $filter('filter')($scope.variables, { variable: $scope.variable });

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
                  $scope.displayMedian = $scope.median;
                  console.log($scope.median);
                  $scope.$apply();
                });

                //querying feature services to get variable value for table
                var queryTask = new QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0");
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ["*"];

                var queryTask2 = new QueryTask($scope.mapUrl);
                var query2 = new Query();
                query2.returnGeometry = true;
                query2.outFields = ["*"];

                $scope.pick = $scope.nhood;
                $scope.sum=0;
                query.where = "name = '" + $scope.pick + "'";
                queryTask.execute(query, function(results) {
                query2.geometry = results.features[0].geometry;

                queryTask2.execute(query2, showResults);
                });

              //function to calculate variable value for neighborhood
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
              }//end of function showResults



              parser.parse();

              //Map code
              var neighborhoodsUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";

              var featureUrl = new FeatureLayer($scope.mapUrl, {
                  mode: FeatureLayer.MODE_ONDEMAND,
                  outFields: ["*"],
                  opacity: 0
              });

              var neighborhoods = new FeatureLayer(neighborhoodsUrl, {
                  id: "neighborhoods",
                  outFields: ["*"],
              });

              //Code for map Legend
              map.on("layers-add-result", function (evt) {
                  var layerInfo = arrayUtils.map(evt.layers, function (layer, index) {
                    return {layer:layer.layer, title:"Map Legend"};
                  });

                  console.log(layerInfo);

                  if (layerInfo.length > 0) {
                    var legendDijit = new Legend({
                    map: map,
                    layerInfos: layerInfo
                  }, "legendDiv");
                  legendDijit.startup();
                }
              });

              //querying to fetch selected neighborhood geometry
              var queryGetGeometryTask = new QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0");
              var queryGetGeometry = new Query;

              queryGetGeometry.returnGeometry = true;
              queryGetGeometry.outFields = ["*"];
              queryGetGeometry.outSpatialReference = map.spatialReference;

              queryGetGeometry.where = "name = '" + $scope.nhood + "'";
              queryGetGeometryTask.execute(queryGetGeometry, function(results) {
                  $scope.neighborhoodGeometry = results.features[0].geometry;
              }).then(function(){

              //Code to highlight census tracts intersecting with drawn polygon
                $scope.jsonLink = $scope.mapUrl + "?f=pjson";

                var censusQueryTask = new QueryTask($scope.mapUrl);
                var censusQuery = new Query();
                censusQuery.returnGeometry = true;
                censusQuery.outFields = [
                  "*"
                ];
                censusQuery.outSpatialReference = map.spatialReference;

                $http({
                  method: 'GET',
                  url: $scope.jsonLink
                }).then(function (response) {

                      $scope.trial = response.data.drawingInfo.renderer;
                      censusQuery.geometry = $scope.neighborhoodGeometry;
                      var symbol;
                      var drawGraphic;
                      censusQueryTask.execute(censusQuery, function(results){

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
                                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(
                                  SimpleLineSymbol.STYLE_SOLID,
                                  new Color($scope.trial.classBreakInfos[j].symbol.outline.color), 1
                                  ), new Color($scope.trial.classBreakInfos[j].symbol.color));

                                drawGraphic = new Graphic(results.features[k].geometry,symbol);

                                map.graphics.add(drawGraphic);
                              }
                          }

                          k++;

                        }
                    }).then(function(){

                        var color = new Color([255,0,0]);
                        var neighborhoodBoundary = new SimpleLineSymbol("solid", color, 3);
                        var highlightGraphic = new Graphic($scope.neighborhoodGeometry,neighborhoodBoundary);
                        map.graphics.add(highlightGraphic);
                      });//queryTask ends

                  map.addLayers([neighborhoods]);

              }); //http call ends

            }); //end of queryGetGeometryTask

          });//end of esriLoader

        });//end of http call to gs-variables

        $http({
            method: 'GET',
            url: 'http://localhost:3000/GS-Neighborhood'
          }).then(function (response) {
                $scope.neighborhood = response.data.data;
                $scope.about = $filter('filter')($scope.neighborhood, { neighborhood: $scope.nhood });

                esriLoader.require([
                    "esri/map",
                    "esri/geometry/Extent",
                    "esri/tasks/query",
                    "esri/tasks/QueryTask",
                    "dojo/domReady!"
                  ], function(Map, Extent, Query, QueryTask) {

                    //setting extent of the map according to neighborhood selected
                      $scope.startExtent = new Extent();
                      $scope.startExtent.xmin = $scope.about[0].minpointx;
                      $scope.startExtent.ymin = $scope.about[0].minpointy;
                      $scope.startExtent.xmax = $scope.about[0].maxpointx;
                      $scope.startExtent.ymax = $scope.about[0].maxpointy;

                map.setExtent($scope.startExtent, true);

              });

            }).then(function(response){

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

                        //slider code
                        var pop = $filter('filter')($scope.main, { variable: $scope.variable });
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

                      var queryTaskchart = new QueryTask(featureUrls[0]);
                      var querychart = new Query();
                      var min;
                      var ind = 0;

                      $scope.calculateValues = function(ind){

                        queryTaskchart = new QueryTask(featureUrls[ind]);
                        querychart = new Query();
                        var medianItems = [];
                        querychart.geometry = $scope.startExtent;
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
                          ind++;
                          if(ind == featureUrls.length){
                            //chart code
                            var ctx = document.getElementById("chart").getContext('2d');
                            var avg = Math.abs(($scope.values[$scope.values.length - 1] - $scope.values[0])/$scope.values.length);
                            var startValue = Math.max(0,Math.round(min-avg));
                            if(avg == 0){
                              startValue = 0;
                            }
                            var myChart = new Chart(ctx, {
                              type: 'line',
                              data: {
                                labels: $scope.years,
                                datasets: [{
                                  label: $scope.variable,
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
                                        min: startValue,
                                      }
                                    }]
                                  }
                                }
                              });//chart code finishes

                            }
                          }).then(function(){
                            if(ind < featureUrls.length){
                              $scope.calculateValues(ind);
                            }
                          });
                        }//end of calculateValues function

                    $scope.calculateValues(ind);

                });//end of esriLoader

            },function(err){
                    console.log(err);
            }); //end of http call to main spreadsheet

          });//end of http call to neighborhood spreadsheet

    }//end of onMapLoad function

      $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Region'
      }).then(function (response) {
            $scope.regionData = response.data.data;
          });

      $scope.newMap = function(topic){
          sessionStorage.lastname =  JSON.stringify($scope.mapdata);
          sessionStorage.variable = JSON.stringify(topic.variable);
          sessionStorage.varUrl = JSON.stringify(topic["feature-serviceurl"] + "/0");
          $window.location.reload();
      };

      $scope.dispMenu = function(topic){
          alert();
          $scope.ds = topic["Policy Area"];
          alert($scope.ds);
      }

      $scope.dispSubMenu = function(topic){
          $scope.var = topic.Dataset;
      }

});
