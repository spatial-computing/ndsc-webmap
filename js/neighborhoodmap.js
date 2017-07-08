'use strict';

angular.module('myModule', ['angular.filter','esri.map', 'rzModule', 'ui.bootstrap'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

    //getting the variables stored in sessionStorage
      $scope.nhood = JSON.parse(sessionStorage.nhood);
      $scope.variable = JSON.parse(sessionStorage.variable);
      $scope.mapUrl = JSON.parse(sessionStorage.varUrl);

      $scope.bool=true; //required for slider

      $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Variables'
      }).then(function (response) {
            $scope.variables = response.data.data;
            $scope.varMapDash = $filter('filter')($scope.variables, { variable: $scope.variable });

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
            $scope.main = response.data.data;

            //slider code
            var varObject = $filter('filter')($scope.main, { variable: $scope.variable });
			      $scope.varDataUrl = varObject[0]["open-dataurl"];

            if (varObject.length!=0) {
              $scope.max=parseInt(varObject[0].year);
              $scope.min=parseInt(varObject[0].year);

              for (var i = 0; i < varObject.length; i++) {
                if(varObject[i].year>$scope.max)$scope.max=varObject[i].year;
                if(varObject[i].year<$scope.min)$scope.min=varObject[i].year;
              }
              $scope.chlistener = function(val) {
                $scope.lastSliderUpdated = $scope.slider_ticks_values_tooltip.value;
                var varObject1 = $filter('filter')(varObject, { year: $scope.lastSliderUpdated});
                $scope.newMap(varObject1[0]);
              };
              --$scope.min;
              ++$scope.min;
              $scope.slider_ticks_values_tooltip = {
                      value: $scope.max,
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
        }); //end of http call to main spreadsheet

      $scope.newMap = function(topic){
          sessionStorage.lastname =  JSON.stringify($scope.mapdata);
          sessionStorage.variable = JSON.stringify(topic.variable);
          sessionStorage.varUrl = JSON.stringify(topic["feature-serviceurl"]);
          $window.location.reload();
      };

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
              "esri/dijit/Legend",
              "dojo/_base/array",
              "dojo/parser",
              "esri/tasks/query",
              "esri/tasks/QueryTask",
              "dojo/domReady!"
            ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
              TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, Legend,
              arrayUtils, parser, Query, QueryTask) {

                parser.parse();

              //Map code
              var neighborhoodsUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";

              var featureUrl = new FeatureLayer($scope.mapUrl, {
                  mode: FeatureLayer.MODE_ONDEMAND,
                  outFields: ["*"]
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
                  if (layerInfo.length > 0) {
                    var legendDijit = new Legend({
                    map: map,
                    layerInfos: layerInfo
                  }, "legendDiv");
                  legendDijit.startup();
                }
              });

              map.addLayers([featureUrl,neighborhoods]);

              //Enabling Hover functionality on the map
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

                neighborhoods.on("mouse-over", function(evt){
                  var t = "<b>${name}</b>";
                  var content = esriLang.substitute(evt.graphic.attributes,t);
                  var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
                  map.graphics.add(highlightGraphic);
                  map.infoWindow.setContent(content);
                  map.infoWindow.setTitle("Neighborhood");
                  map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
                });

              //   //querying feature services to get variable value for table
              //   var queryTask = new QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0");
              //   var query = new Query();
              //   query.returnGeometry = true;
              //   query.outFields = ["*"];
              //
              //   var queryTask2 = new QueryTask($scope.mapUrl);
              //   var query2 = new Query();
              //   query2.returnGeometry = true;
              //   query2.outFields = ["*"];
              //
              //   $scope.pick = $scope.nhood;
              //   $scope.sum=0;
              //   query.where = "name = '" + $scope.pick + "'";
              //   queryTask.execute(query, function(results) {
              //   query2.geometry = results.features[0].geometry;
              //   queryTask2.execute(query2, showResults);
              //   });
              //
              // //function to calculate variable value for neighborhood
              // function showResults (results) {
              //   var resultItems = [];
              //   var resultCount = results.features.length;
              //   for (var i = 0; i < resultCount; i++) {
              //     var featureAttributes = results.features[i].attributes;
              //     if(featureAttributes[$scope.varMapDash[0].fieldname] != -9999) {
              //       resultItems.push(featureAttributes[$scope.varMapDash[0].fieldname]);
              //     }
              //   }
              //
              //   for (var i = 0; i < resultItems.length; i++) {
              //     $scope.sum += resultItems[i];
              //   }
              //
              //   if ($scope.varMapDash[0].fieldtype == "total") {
              //     $scope.tableAnswer = Math.round($scope.sum * 100) / 100;
              //   }
              //   else if($scope.varMapDash[0].fieldtype == "percentage") {
              //     $scope.tableAnswer = (Math.round(($scope.sum/results.features.length) * 100) / 100) + " %" ;
              //   }
              //   else if($scope.varMapDash[0].fieldtype == "income") {
              //     $scope.tableAnswer = "$ " + (Math.round(($scope.sum/results.features.length) * 100) / 100);
              //   }
              //   $scope.$apply();
              // }//end of function showResults

              $http({
                method: 'GET',
                url: 'http://localhost:3000/GS-Neighborhood'
              }).then(function (response) {
                    $scope.neighborhood = response.data.data;
                    $scope.about = $filter('filter')($scope.neighborhood, { neighborhood: $scope.nhood });



                        //setting extent of the map according to neighborhood selected
                          $scope.startExtent = new Extent();
                          $scope.startExtent.xmin = $scope.about[0].minpointx;
                          $scope.startExtent.ymin = $scope.about[0].minpointy;
                          $scope.startExtent.xmax = $scope.about[0].maxpointx;
                          $scope.startExtent.ymax = $scope.about[0].maxpointy;

                    map.setExtent($scope.startExtent);
            //       });
            //
            //   //map.setExtent($scope.startExtent);
            //
            // });//end of esriLoader

            //chart code begins here
            $scope.url = $scope.mapUrl;
            $scope.jsonUrl = $scope.mapUrl + "?f=pjson";

            $http({
                method: 'GET',
                url: $scope.jsonUrl
            }).then(function (response) {
                    $scope.trial = response.data.drawingInfo.renderer;
                    var groupByExpression = "CASE ";
                    var arr = $scope.trial.classBreakInfos;
                    groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " < 0 OR "+$scope.trial.field+ " IS NULL THEN 'No Data' ";
                    for (var i = 1, len = $scope.trial.classBreakInfos.length; i < len; i++){
                       groupByExpression = groupByExpression + "WHEN "+$scope.trial.field+ " BETWEEN "+$scope.trial.classBreakInfos[i-1].classMaxValue+" AND "+$scope.trial.classBreakInfos[i].classMaxValue+" THEN '"+$scope.trial.classBreakInfos[i].label+"' ";
                    }
                    groupByExpression = groupByExpression + " END";

                    $scope.nhood = JSON.parse(sessionStorage.nhood);
                    var box = $scope.about[0].minpointx + ',' + $scope.about[0].maxpointx + ',' + $scope.about[0].minpointy + ',' + $scope.about[0].maxpointy;

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
                          }],
                          "bbox": box
                        },
                        "mappings":{
                          "x": {"field":"EXPR_1","label":"Range"},
                          "y": {"field":"RangeCount","label":"Count"},
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
            });//http function ends

          });

      //map.setExtent($scope.startExtent);

    });//end of esriLoader




      }; //end of onMapLoad function



      $scope.dispMenu = function(topic){
          alert();
          $scope.ds = topic["Policy Area"];
          alert($scope.ds);
      }

      $scope.dispSubMenu = function(topic){
          $scope.var = topic.Dataset;
      }

});
