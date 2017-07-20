'use strict';

angular.module('myModule', ['esri.map','rzModule', 'ui.bootstrap'])
    .controller('myController', function($scope, $http, $filter, esriLoader) {

    var map;
    var map2;
    var ext;

    sessionStorage.var = JSON.stringify("Median Household Income");
    sessionStorage.varURL = JSON.stringify("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Income_MedianHouseholdIncome_2015_NDSC/FeatureServer/0");
    sessionStorage.mapYear = JSON.stringify(2015);

    function sliderResize() {
        setTimeout(function(){
            $scope.$broadcast('reCalcViewDimensions');
        },500);
    }


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

                mainFunc();
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
            "esri/tasks/QueryTask",
            "esri/tasks/query",
            "esri/symbols/CartographicLineSymbol",
            "esri/toolbars/draw",
            'esri/symbols/PictureFillSymbol',
            "esri/geometry/webMercatorUtils",
            "esri/geometry/Polygon",
            "esri/dijit/Legend",
            "dojo/_base/array",
            "dojo/parser",
            "esri/dijit/HomeButton",
            "dojo/domReady!"
        ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
                     TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, QueryTask, Query, CartographicLineSymbol, Draw, PictureFillSymbol, webMercatorUtils, Polygon, Legend, arrayUtils, parser, HomeButton) {

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

            // create a renderer for the states layer to override default symbology
            var nhdColor = new Color("#FF3300");
            var nhdLine = new SimpleLineSymbol("solid", nhdColor, 1.5);
            var nhdSymbol = new SimpleFillSymbol("solid", nhdLine, null);
            var nhdRenderer = new SimpleRenderer(nhdSymbol);

            var neighborhoodsUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";

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

            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,112,255,255]), 2), new Color([173,216,230]));

            neighborhoods.setRenderer(new SimpleRenderer(symbol));

            map.addLayer(neighborhoods);

            //create highlight symbol for hover
            var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color("#191165"), 1), new Color([ 0, 197, 255]));

            map.on("load", function(){
                map.graphics.enableMouseEvents();
            });

            //get region selected on click
            var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0");
            var query = new esri.tasks.Query();
            query.returnGeometry = true;
            query.outFields = ["name"];


            var toolBar;

            var lineSymbol = new CartographicLineSymbol(CartographicLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 5, CartographicLineSymbol.CAP_ROUND, CartographicLineSymbol.JOIN_MITER, 5);

            var fillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2), new Color([255,0,0,0.15]));

            function initToolbar(mapObj) {
                map = mapObj;
                toolBar = new Draw(map);
                toolBar.on('draw-complete', function(e) {
                    addGraphic(e);
                });

                // set the active tool once a button is clicked
                $scope.activateDrawTool = activateDrawTool;
            }

            function activateDrawTool(tool) {
                map.disableMapNavigation();
                toolBar.activate(tool.toLowerCase());
            }

            function addGraphic(evt) {
                //deactivate the toolbar and clear existing graphics
                var symbol = fillSymbol;

                map.graphics.add(new Graphic(evt.geometry, symbol));

                toolBar.deactivate();
                $("#drawButton").removeClass("activeButton");
                $("#drawButton").text("Click here to start drawing!");

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



                $('#mapCarousel').carousel('next');
                myneighborhoodMap();
            }






            //Second Map

            function myneighborhoodMap() {
                $scope.sum = 0;
                $scope.variable = JSON.parse(sessionStorage.var);
                $scope.mapUrl = JSON.parse(sessionStorage.varURL);
                $scope.year = JSON.parse(sessionStorage.mapYear);
                $scope.sliderYear = JSON.parse(sessionStorage.mapYear);

                $scope.varMapDash = $filter('filter')($scope.variables, { variable: $scope.variable });
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
                        tableValue();
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

                $scope.years.reverse();
                $scope.featureUrls.reverse();

                var polygonExtent = new Extent();
                polygonExtent.xmin = -118.953532;
                polygonExtent.ymin = 32.792291;
                polygonExtent.xmax = -117.644108;
                polygonExtent.ymax = 34.823016;

                var queryTaskchart = new QueryTask($scope.featureUrls[0]);
                var querychart = new Query();
                var min;

                var ind = 0;

                $scope.calculateValues = function(ind){

                    queryTaskchart = new QueryTask($scope.featureUrls[ind]);
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
                            });//chart code

                        }
                    }).then(function(){

                        if(ind < $scope.featureUrls.length){
                            $scope.calculateValues(ind);
                        }
                    });
                }
                $scope.calculateValues(ind);

                sliderResize();

                var queryTask = new QueryTask($scope.mapUrl);
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ["*"];

                query.geometry = $scope.geom;
                queryTask.execute(query, function(results){

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
                    $scope.tableAnswer = $scope.sum;
                }
                else if($scope.varMapDash[0].fieldtype == "percentage") {
                    $scope.tableAnswer = (Math.round(($scope.sum/results.features.length) * 100) / 100) + " %" ;
                }
                else if($scope.varMapDash[0].fieldtype == "income") {
                    $scope.tableAnswer = "$ " + (Math.round(($scope.sum/results.features.length) * 100) / 100);
                }

            }).then(function() {

                var neighborhoods2 = new FeatureLayer(neighborhoodsUrl, {
                    id: "neighborhoods",
                    outFields: ["*"],
                    infoTemplate: info,
                });

                var censusTract = new FeatureLayer($scope.mapUrl, {
                    id: "censustract",
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"]
                });

                map2 = new Map("map2", {
                    basemap: "gray",
                    center: [-118.2437, 34.2522],
                    zoom: 9,
                    showLabels : true,
                });

                var home2 = new HomeButton({
                    map: map2
                }, "HomeButton2");
                home2.startup();

                var legend = new Legend({
                    map: map,
                    layerInfos: [{
                    layer: censusTract,
                    title: "Map Legend"
                    }]
                }, "legendDiv");
                legend.startup();

                map2.addLayer(neighborhoods2);

                map2.on("load", function(){
                    map2.graphics.enableMouseEvents();

                    calcMedian();
                    addCensusTract();
                });

                var labelLayer = map2.getLayer("layer3");
                labelLayer.setOpacity(0);

            });
            }



            $scope.newMap = function(topic){
                $scope.mapdata = topic;
                sessionStorage.var = JSON.stringify(topic.variable);
                sessionStorage.varURL = JSON.stringify(topic["feature-serviceurl"]);
                sessionStorage.mapYear =  JSON.stringify($scope.lastSliderUpdated);
            };

            function tableValue() {
                var queryTask = new QueryTask($scope.mapUrl);
                var query = new Query();
                query.returnGeometry = true;
                query.outFields = ["*"];

                query.geometry = $scope.geom;
                queryTask.execute(query, function(results){

                    $scope.sum = 0;
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
                        $scope.tableAnswer = $scope.sum;
                    }
                    else if($scope.varMapDash[0].fieldtype == "percentage") {
                        $scope.tableAnswer = (Math.round(($scope.sum/results.features.length) * 100) / 100) + " %" ;
                    }
                    else if($scope.varMapDash[0].fieldtype == "income") {
                        $scope.tableAnswer = "$ " + (Math.round(($scope.sum/results.features.length) * 100) / 100);
                    }
                    $scope.$apply();
                });
            }

            function addCensusTract() {
                $scope.newGeometry = webMercatorUtils.webMercatorToGeographic($scope.geom);
                ext = $scope.newGeometry.getExtent();

                var polygonExtent = new Extent();
                polygonExtent.xmin = ext.xmin;
                polygonExtent.ymin = ext.ymin;
                polygonExtent.xmax = ext.xmax;
                polygonExtent.ymax = ext.ymax;

                //Code to highlight census tracts intersecting with drawn polygon
                var jsonURL = $scope.mapUrl + "?f=pjson";

                var censusQueryTask = new QueryTask($scope.mapUrl);
                var censusQuery = new Query();
                query.returnGeometry = true;
                query.outFields = ["*"];

                getJSON(jsonURL).then(function(result) {

                    $scope.jsonData = result.data.drawingInfo.renderer;
                    $scope.downloadURL = result.data.serviceItemId;
                    console.log(result.data);
                    console.log($scope.downloadURL);
                    censusQuery.geometry = $scope.geom;
                    var symbol;
                    var drawGraphic;
                    query.geometry = $scope.geom;
                    censusQueryTask.execute(query, function(results){

                        var resultItems = [];
                        var resultCount = results.features.length;
                        for (var i = 0; i < resultCount; i++) {
                            var featureAttributes = results.features[i].attributes;
                            if(featureAttributes[$scope.varMapDash[0].fieldname] != -9999) {
                                resultItems.push(featureAttributes[$scope.varMapDash[0].fieldname]);
                            }
                        }

                        var k=0;
                        for(var i = 0; i < resultItems.length; i++) {

                            for (var j = 1, len = $scope.jsonData.classBreakInfos.length; j < len; j++){
                                if(resultItems[i] >= $scope.jsonData.classBreakInfos[j-1].classMaxValue && resultItems[i] <= $scope.jsonData.classBreakInfos[j].classMaxValue){
                                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color($scope.jsonData.classBreakInfos[j].symbol.outline.color), 1), new Color($scope.jsonData.classBreakInfos[j].symbol.color));

                                    drawGraphic = new Graphic(results.features[k].geometry,symbol);
                                    map2.graphics.add(drawGraphic);
                                }
                            }
                            k++;
                        }

                    }).then(function(){
                        var highlightSymbol2 = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2), new Color([255,0,0,0.15]));
                        var highlightGraphic = new Graphic($scope.geom,highlightSymbol2);
                        map2.graphics.add(highlightGraphic);
                    });//queryTask ends
                }); //http call
            }

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
            }

            function changeYear() {

                map.graphics.clear();
                $scope.exploreRegion = "false";
                var jsonURL = $scope.mapUrl + "?f=pjson"
                getJSON(jsonURL).then(function(result) {
                    $scope.jsonData = result.data;
                    $scope.downloadURL = $scope.jsonData.serviceItemId;
                    console.log($scope.downloadURL);
                });
                calcMedian();
                addCensusTract();

            }

            var labelLayer = map.getLayer("layer1");
            labelLayer.setOpacity(0);

        });//esriLoader ends
    }

    fetchData();

    $scope.getChart = function(){

        var canvas = document.getElementById('chart');
        var dataURL = canvas.toDataURL();
        document.getElementById('printChart').href = dataURL;
        Canvas2Image.saveAsPNG(canvas);

      }
});
