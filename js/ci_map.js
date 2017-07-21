'use strict';

angular.module('myModule', ['angular.filter','esri.map', 'rzModule', 'ui.bootstrap'])
    .controller('myController', function($scope, esriLoader, $filter, $http) {
    
    var map;
    $scope.tableAnswer = {};
    $scope.tracking = {};
    var count = 0;
    var sortedKeys;

    $scope.bool=true;
    
    function getMain(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Main'
        });
    }
    
    function getVariables(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Variables'
        });
    }
    
    function getJSON(jsonURL){
        return $http({
            method: 'GET',
            url: jsonURL
        });
    }
    
    function fetchData() {
        getMain().then(function(result1) {
            $scope.main = result1.data.data;

            getVariables().then(function(result2) {
                $scope.variables = result2.data.data;
                
                $scope.mapData = JSON.parse(sessionStorage.CImapStore);
                var jsonURL = $scope.mapData["feature-serviceurl"] + "/0?f=pjson";
                $scope.url = $scope.mapData["feature-serviceurl"] + "/0";

                getJSON(jsonURL).then(function(result3) {
                    $scope.jsonData = result3.data;
                    $scope.downloadURL = $scope.jsonData.serviceItemId;
                    
                    $scope.chartData = result3.data.drawingInfo.renderer;
                    var groupByExpression = "CASE ";
                    var arr = $scope.chartData.classBreakInfos;
                    groupByExpression = groupByExpression + "WHEN "+$scope.chartData.field+ " < 0 OR "+$scope.chartData.field+ " IS NULL THEN 'No Data' ";
                    for (var i = 1, len = $scope.chartData.classBreakInfos.length; i < len; i++)
                    {
                        groupByExpression = groupByExpression + "WHEN "+$scope.chartData.field+ " BETWEEN "+$scope.chartData.classBreakInfos[i-1].classMaxValue+" AND "+$scope.chartData.classBreakInfos[i].classMaxValue+" THEN '"+$scope.chartData.classBreakInfos[i].label+"' ";
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
                                    "onStatisticField": $scope.chartData.field,
                                    "outStatisticFieldName": "RangeCount"
                                }]
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

                    mainFunc();
                });
            });
        });
    }
    
    function mainFunc() {
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
            "esri/dijit/HomeButton",
            "esri/dijit/Print",
            "dojo/dom",
            "dijit/form/Button",
            "esri/config",
            "dojo/domReady!"
        ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
        TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, Legend,
        arrayUtils, parser, Query, QueryTask, HomeButton, Print, dom, Button, esriConfig) {

            // load the map centered on the United States
            parser.parse();
            
            map = new Map("map", {
                basemap: 'gray',
                center: [-118.2437, 34.2522],
                zoom: 9,
                showLabels : true
            });

            var home = new HomeButton({
                map: map
            }, "HomeButton");
            home.startup();
            
            $scope.mapData = JSON.parse(sessionStorage.CImapStore);
            $scope.mapUrl = $scope.mapData["feature-serviceurl"] + "/0";
            
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
            var nhdColor = new Color("#FF3300");
            var nhdLine = new SimpleLineSymbol("solid", nhdColor, 1.5);
            var nhdSymbol = new SimpleFillSymbol("solid", nhdLine, null);
            var nhdRenderer = new SimpleRenderer(nhdSymbol);

            var neighborhoodsUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";

            //var neighborhoodsUrl = $scope.mapData["Feature-service URL"] + "/0";
            var censusTract = new FeatureLayer($scope.mapUrl, {
                id: "censustract",
                mode: FeatureLayer.MODE_ONDEMAND,
                outFields: ["*"]
            });

            var info = new esri.InfoTemplate();
            info.setTitle("Neighborhood");
            info.setContent("${name}");

            var neighborhoods = new FeatureLayer(neighborhoodsUrl, {
            id: "neighborhoods",
            outFields: ["*"],
            infoTemplate: info,
            });

            var nhdLabel = new TextSymbol().setColor(nhdColor);
            nhdLabel.font.setSize("9pt");
            nhdLabel.font.setFamily("arial");
            
            var json = {
                "labelExpressionInfo": {"value": "{name}"}
            };
            
            var labelClass = new LabelClass(json);
            labelClass.symbol = nhdLabel;
            
            var legend = new Legend({
                map: map,
                layerInfos: [{
                layer: censusTract,
                title: "Map Legend"
                }]
            }, "legendDiv");
            legend.startup();
            
            map.addLayers([censusTract,neighborhoods]);
            
            var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID, new Color("#191165"), 1), new Color([255,0,0,0.5]));

            map.on("load", function(){
                map.graphics.enableMouseEvents();
                calcMedian();
            });
            
            neighborhoods.on("mouse-out", function() {
                map.infoWindow.hide();
            });

            neighborhoods.on("mouse-over", function(evt){
                var t = "<b>${name}</b>";
                var content = esriLang.substitute(evt.graphic.attributes,t);
                map.infoWindow.setContent(content);
                map.infoWindow.setTitle("Neighborhood");
                map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
            });
            
            $scope.table = "false";
            
            map.on("click", function(evt){

                var queryTask2 = new QueryTask($scope.mapUrl);

                $scope.exploreRegion = "true";
                $scope.table = "true";

                query0.geometry = evt.mapPoint;
                queryTask0.execute(query0, function(result) {
                    $scope.pick = result.features[0].attributes.name;
                    $scope.sum=0;

                    if ($scope.tableAnswer[$scope.pick]) {
                        sortedKeys = Object.values($scope.tracking).sort();
                        map.graphics.remove(map.graphics.graphics[sortedKeys.indexOf($scope.tracking[$scope.pick])+1]);
                        delete $scope.tracking[$scope.pick];
                        delete $scope.tableAnswer[$scope.pick];
                        if (Object.keys($scope.tableAnswer).length === 0) {
                            $scope.table = "false";
                        }
                        $scope.$apply();
                    }

                    else {
                        var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
                        map.graphics.add(highlightGraphic);

                        query.where = "name = '" + $scope.pick + "'";
                        queryTask0.execute(query, function(results) {
                            query2.geometry = results.features[0].geometry;
                            queryTask2.execute(query2, showResults);
                        });
                    }
                });

                function showResults (results) {
                    var resultItems = [];
                    var resultCount = results.features.length;
                    for (var i = 0; i < resultCount; i++) {
                        var featureAttributes = results.features[i].attributes;
                        if(featureAttributes[$scope.mapData.fieldname] != -9999) {
                            resultItems.push(featureAttributes[$scope.mapData.fieldname]);
                        }
                    }

                    for (var i = 0; i < resultItems.length; i++) {
                        $scope.sum += resultItems[i];
                    }

                    $scope.tableAnswer[$scope.pick] = (Math.round(($scope.sum/resultItems.length) * 10000) / 10000) ;
                    $scope.tracking[$scope.pick] = count++;
                    $scope.$apply();
                }

            }); //map.on(click)
            
            function calcMedian() {
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
                        if(result.features[i].attributes[$scope.mapData.fieldname] != -9999)
                            medianItems.push(result.features[i].attributes[$scope.mapData.fieldname]);
                    }

                    medianItems.sort(function(a, b){return a-b});
                    if (medianItems.length % 2) {
                        $scope.median = medianItems[(1 + medianItems.length)/2];
                    }
                    else {
                        $scope.median = (medianItems[(medianItems.length)/2] + medianItems[((medianItems.length)/2)+1])/2;
                    }

                    $scope.median = Math.round($scope.median * 100000) / 100000;

                    $scope.$apply();
                });
            }
        });

    }
    
    fetchData();
});
