'use strict';

angular.module('myModule', ['angular.filter','esri.map', 'rzModule', 'ui.bootstrap'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

    $scope.nhood = JSON.parse(sessionStorage.nhood);
    $scope.variable = JSON.parse(sessionStorage.variable);
    $scope.mapUrl = JSON.parse(sessionStorage.varUrl);
    $scope.sliderYear = JSON.parse(sessionStorage.mapYear);

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

    function getRegions(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Region'
        });
    }

    function getVariables(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Variables'
        });
    }

    function getNeighborhoods(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Neighborhood'
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

            getRegions().then(function(result2) {
                $scope.regions = result2.data.data;

                getVariables().then(function(result3) {
                    $scope.variables = result3.data.data;
                    $scope.varMapDash = $filter('filter')($scope.variables, { variable: $scope.variable });

                    var jsonURL = $scope.mapUrl + "?f=pjson";

                    getNeighborhoods().then(function(result4){

                        $scope.neighborhood = result4.data.data;
                        $scope.about = $filter('filter')($scope.neighborhood, { neighborhood: $scope.nhood });

                        getJSON(jsonURL).then(function(result5) {
                            $scope.jsonData = result5.data;
                            $scope.downloadURL = $scope.jsonData.serviceItemId;

                            mainFunc();
                        });
                    });
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
            "esri/SpatialReference",
            "dojo/domReady!"
        ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
        TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, Legend,
        arrayUtils, parser, Query, QueryTask, HomeButton, Print, dom, Button, esriConfig, SpatialReference) {

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

            var labelField = "name";

            var nhdColor = new Color([150,150,150]);
            var nhdLine = new SimpleLineSymbol("solid", nhdColor, 1.5);
            var nhdSymbol = new SimpleFillSymbol("solid", nhdLine, null);
            var nhdRenderer = new SimpleRenderer(nhdSymbol);

            var neighborhoodsUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";

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

            var queryGetGeometryTask = new QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0");
            var queryGetGeometry = new Query();
            var spatialReference = new SpatialReference({wkid:102100});

            queryGetGeometry.returnGeometry = true;
            queryGetGeometry.outFields = ["*"];
            queryGetGeometry.outSpatialReference = spatialReference;

            queryGetGeometry.where = "name = '" + $scope.nhood + "'";
            queryGetGeometryTask.execute(queryGetGeometry, function(results) {
                $scope.neighborhoodGeometry = results.features[0].geometry;
            }).then(function(){
                showCensusTracts();
                $scope.startExtent = new Extent();
                $scope.startExtent.xmin = $scope.about[0].minpointx;
                $scope.startExtent.ymin = $scope.about[0].minpointy;
                $scope.startExtent.xmax = $scope.about[0].maxpointx;
                $scope.startExtent.ymax = $scope.about[0].maxpointy;
                map.setExtent($scope.startExtent, true).then(function(){
                    map.setLevel(map.getLevel() - 1)
                } );
                var ind=0;
                $scope.calculateValues(ind);
            });

            $scope.variableObjects = $filter('filter')($scope.main, { variable: $scope.variable });

            $scope.values = [];
            $scope.years = [];
            $scope.featureUrls = [];

            if ($scope.variableObjects.length!=1) {
                $scope.max = parseInt($scope.variableObjects[0].year);
                $scope.min = parseInt($scope.variableObjects[0].year);

                for (var i = 0; i < $scope.variableObjects.length; i++) {
                    if($scope.variableObjects[i].year>$scope.max)
                        $scope.max = $scope.variableObjects[i].year;
                    if($scope.variableObjects[i].year<$scope.min)
                        $scope.min = $scope.variableObjects[i].year;
                    $scope.years.push($scope.variableObjects[i].year);
                    $scope.featureUrls.push($scope.variableObjects[i]["feature-serviceurl"] + "/0");
                }

                $scope.sliderListener = function(val) {
                    $scope.lastSliderUpdated = $scope.slider_ticks_values_tooltip.value;
                    $scope.yearObject = $filter('filter')($scope.variableObjects, { year: $scope.lastSliderUpdated});
                    sessionStorage.mapYear =  JSON.stringify($scope.lastSliderUpdated);
                    $scope.mapUrl = $scope.yearObject[0]["feature-serviceurl"] + "/0";
                    $scope.year = angular.copy($scope.lastSliderUpdated);
                    changeYear();
                };
                
                --$scope.min;
                ++$scope.min;

                $scope.slider_ticks_values_tooltip = {
                    value: $scope.sliderYear,
                    options: {
                        ceil: $scope.max,
                        floor: $scope.min,
                        showTicksValues: true,
                        onChange: $scope.sliderListener
                    }
                };

                $scope.bool=true;
            }
            else {
                $scope.bool=false;
                $scope.years.push($scope.variableObjects[0].year);
                $scope.featureUrls.push($scope.variableObjects[0]["feature-serviceurl"] + "/0");
            }

            map.on("load", function(){
                map.graphics.enableMouseEvents();
                calcMedian();
                calcTableValue();
            });

            $scope.years.reverse();
            $scope.featureUrls.reverse();

            var queryTaskchart = new QueryTask($scope.featureUrls[0]);
            var querychart = new Query();
            var min;

            var ind = 0;

            $scope.calculateValues = function(ind){

                queryTaskchart = new QueryTask($scope.featureUrls[ind]);
                querychart = new Query();
                var tableItems = [];
                querychart.geometry = $scope.neighborhoodGeometry;
                querychart.outFields = ["*"];

                queryTaskchart.execute(querychart, function(result) {

                    for (var i = 0; i < result.features.length; i++) {
                        if(result.features[i].attributes[$scope.varMapDash[0].fieldname] != -9999)
                            tableItems.push(result.features[i].attributes[$scope.varMapDash[0].fieldname]);
                    }
                    var tableSum = 0;                
                    for (var i = 0; i < tableItems.length; i++) {
                        tableSum += tableItems[i];
                    }
                    
                    var avg = tableSum/tableItems.length;
                    avg = Math.round(avg * 100) / 100;
                    
                    $scope.values.push(avg);
                    if(min == null){
                        min = avg;
                    }
                    if(avg < min){
                        min = avg;
                    }
                    ind++;
                    if(ind == $scope.featureUrls.length){

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
                                        },
                                        scaleLabel: {
                                            display: true,
                                            labelString: 'Data'
                                        }
                                    }],
                                    xAxes: [{
                                        scaleLabel: {
                                            display: true,
                                            labelString: 'Year'
                                        }
                                    }]
                                }
                            }
                        });
                    }
                }).then(function(){

                    if(ind < $scope.featureUrls.length){
                        $scope.calculateValues(ind);
                    }
                });
              }

            function calcTableValue(){
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
                        $scope.tableAnswer = (Math.round(($scope.sum/resultItems.length) * 100) / 100) + " %" ;
                    }
                    else if($scope.varMapDash[0].fieldtype == "income") {
                        $scope.tableAnswer = "$ " + (Math.round(($scope.sum/resultItems.length) * 100) / 100);
                    }
                    $scope.$apply();
                }
            }

            function changeYear() {
                map.graphics.clear();
                showCensusTracts();
                var jsonURL = $scope.mapUrl + "?f=pjson";

                getJSON(jsonURL).then(function(result) {
                    $scope.jsonData = result.data;
                    $scope.downloadURL = $scope.jsonData.serviceItemId;
                });

                calcMedian();
                calcTableValue();
            }

            function calcMedian() {
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
                    $scope.$apply();
                });
            }

            function showCensusTracts(){

                $scope.jsonLink = $scope.mapUrl + "?f=pjson";

                var censusQueryTask = new QueryTask($scope.mapUrl);
                var censusQuery = new Query();
                censusQuery.returnGeometry = true;
                censusQuery.outFields = ["*"];
                censusQuery.outSpatialReference = map.spatialReference;
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

                    $scope.classBreaks = $scope.jsonData.drawingInfo.renderer;

                    for (var i = (select-1); i < resultItems.length; i+=(count/results.features.length)) {

                        for (var j = 1, len = $scope.classBreaks.classBreakInfos.length; j < len; j++){
                      
                            if(resultItems[i] >= $scope.classBreaks.classBreakInfos[j-1].classMaxValue && resultItems[i] <= $scope.classBreaks.classBreakInfos[j].classMaxValue){
                                symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color($scope.classBreaks.classBreakInfos[j].symbol.outline.color), 1), new Color($scope.classBreaks.classBreakInfos[j].symbol.color));
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
                    map.addLayers([neighborhoods]);
                });
            }
            var labelLayer = map.getLayer("layer1");
            labelLayer.setOpacity(0);
        });
    }

    fetchData();

});

function getChart(){
    var canvas = document.getElementById('chart');
    var dataURL = canvas.toDataURL();
    document.getElementById('printChart').href = dataURL;
    Canvas2Image.saveAsPNG(canvas);
}
