'use strict';

angular.module('myModule', ['esri.map','rzModule', 'ui.bootstrap'])
    .controller('myController', function($scope, $http, $filter, esriLoader) {

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

                    $scope.mapData = JSON.parse(sessionStorage.mapStore);
                    var jsonURL = $scope.mapData["feature-serviceurl"] + "/0?f=pjson";

                    getJSON(jsonURL).then(function(result4) {
                        $scope.jsonData = result4.data;
                        $scope.downloadURL = $scope.jsonData.serviceItemId;

                        mainFunc();
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
            "dojo/domReady!"
        ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
        TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, Legend,
        arrayUtils, parser, Query, QueryTask, HomeButton, Print, dom, Button, esriConfig) {

            // load the map centered on the United States
            parser.parse();

//            esriConfig.defaults.io.proxyUrl = "/proxy/";

            map = new Map("map", {
                basemap: 'gray',
                center: [-118.2437, 34.2522],
                zoom: 9,
                showLabels : true
            });

            // var printer = new Print({
            //   map: map,
            //   url: $scope.mapUrl
            // }, dom.byId("printButton"));
            // printer.startup();
            //
            // printer.on('error',function(error){
            //   console.log(error);
            // })

            var home = new HomeButton({
                map: map
            }, "HomeButton");
            home.startup();

//            var printer = new Print({
//                map: map,
//                url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
//            }, dom.byId("printButton"));
//            printer.startup();

            $scope.mapData = JSON.parse(sessionStorage.mapStore);
            $scope.sliderYear = JSON.parse(sessionStorage.mapYear);
            $scope.mapUrl = $scope.mapData["feature-serviceurl"] + "/0";
            $scope.year = JSON.parse(sessionStorage.mapYear);

            $scope.varMapDash = $filter('filter')($scope.variables, { variable: $scope.mapData["variable"] });
            $scope.variableObjects = $filter('filter')($scope.main, { variable: $scope.mapData["variable"] });

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
                var tableItems = [];
                querychart.geometry = polygonExtent;
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


            var queryTask0 = new QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0");
            var query0 = new Query();
            query0.returnGeometry = true;
            query0.outFields = ["*"];

            var query1 = new Query();
            query1.returnGeometry = true;
            query1.outFields = ["*"];

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
            $scope.exploreRegion = "false";

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

                        query1.where = "name = '" + $scope.pick + "'";
                        queryTask0.execute(query1, function(results) {
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
                        if(featureAttributes[$scope.varMapDash[0].fieldname] != -9999) {
                            resultItems.push(featureAttributes[$scope.varMapDash[0].fieldname]);
                        }
                    }

                    for (var i = 0; i < resultItems.length; i++) {
                        $scope.sum += resultItems[i];
                    }

                    if ($scope.varMapDash[0].fieldtype == "total") {
                        $scope.tableAnswer[$scope.pick] = Math.round($scope.sum * 100) / 100;
                        $scope.tracking[$scope.pick] = count++;
                    }
                    else if($scope.varMapDash[0].fieldtype == "percentage") {
                        $scope.tableAnswer[$scope.pick] = (Math.round(($scope.sum/resultItems.length) * 100) / 100) + " %" ;
                        $scope.tracking[$scope.pick] = count++;
                    }
                    else if($scope.varMapDash[0].fieldtype == "income") {
                        $scope.tableAnswer[$scope.pick] = "$ " + (Math.round(($scope.sum/resultItems.length) * 100) / 100);
                        $scope.tracking[$scope.pick] = count++;
                    }
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

                var censusTractnew = new FeatureLayer($scope.mapUrl, {
                    id: "censustract",
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"]
                });

                map.removeLayer(map.getLayer('censustract'));
                map.removeLayer(neighborhoods);
                map.addLayers([censusTractnew,neighborhoods]);
                $scope.tableAnswer = {};
                map.graphics.clear();

                $scope.table = "false";
                $scope.exploreRegion = "false";

                var jsonURL = $scope.mapUrl + "?f=pjson"
                getJSON(jsonURL).then(function(result) {
                    $scope.jsonData = result.data;
                    $scope.downloadURL = $scope.jsonData.serviceItemId;
                });

                calcMedian();
            }
            var labelLayer = map.getLayer("layer1");
            labelLayer.setOpacity(0);

        }); //esriLoader
    }



    fetchData();

    $scope.getChart = function(){

        var canvas = document.getElementById('chart');
        var dataURL = canvas.toDataURL();
        document.getElementById('printChart').href = dataURL;
        Canvas2Image.saveAsPNG(canvas);

      }

//       $scope.printMap = function(div)
//     {
//       var element = document.getElementById(div);
//     html2canvas((element), {
//         useCORS: true,
//         allowTaint: false,
//         onrendered: function(canvas) {
//             var img = canvas.toDataURL();
//             window.open(img);
//       }
//     });
// }

});
