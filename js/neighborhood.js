'use strict';

angular.module('myModule', ['angular.filter','esri.map'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

    var map2;
    $scope.mapFlag = 0;
    
    $http({
        method: 'GET',
        url: 'http://6370bd5f.ngrok.io/GS-Neighborhood'
    }).then(function (response){
        $scope.neighborhood = response.data.data;
    });

    $http({
        method: 'GET',
        url: 'http://6370bd5f.ngrok.io/GS-Region'
    }).then(function (response){
        $scope.regionData = response.data.data;
    });

    $scope.neighborhoods = function(reg){
        $('#mapCarousel').carousel('next');
        $scope.regionpick = reg.region;
        $scope.regionMap();
    }

    $scope.neighborhoodmap = function(dataset){
        $scope.mapdata = dataset;
        sessionStorage.nhood =  JSON.stringify($scope.mapdata);
        sessionStorage.mapYear = JSON.stringify("2015");
        sessionStorage.variable = JSON.stringify("Median Household Income");
        sessionStorage.varUrl =     JSON.stringify("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Income_MedianHouseholdIncome_2015_NDSC/FeatureServer/0");
    };

    $scope.regionMap = function() { 
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
            "esri/dijit/Search",
            "esri/symbols/PictureMarkerSymbol",
            "esri/tasks/locator",
            "dojo/domReady!"
        ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, QueryTask, Query,Search,PictureMarkerSymbol,Locator) {

            if($scope.mapFlag == 1){
                map2.destroy();
            }

            $scope.mapFlag = 1;
            var url = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0";
            var url2 = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0";
            var info = new esri.InfoTemplate();
            info.setTitle("Neighborhood");
            info.setContent("${name}");

            var mapLayer = new FeatureLayer(url, {
                id: "regionMap",
                outFields: ["*"],
                infoTemplate: info
            });

            var regionMapLayer = new FeatureLayer(url2, {
                id: "regionMapLayer",
                outFields: ["*"],
            });

            map2 = new Map("map2", {
                basemap: "gray",
                center: [-118.2437, 34.2522],
                zoom: 9,
                showLabels : true,
                layers: regionMapLayer
            });

            var searchNeighborHoodName = new Search({
                sources: [
                    {
                        featureLayer: mapLayer,
                        outFields:["name"],
                        displayField: "name",
                        suggestionTemplate: "${name}",
                        name: "Search",
                        placeholder: "Search NeighborHood Name",
                        enableSuggestions: true
                    }
                ],
                map: map2,
            }, "searchNeighborHoodName");

            searchNeighborHoodName.startup();

            var searchStreetAddress2 = new Search({
                sources: [
                    {
                        locator: new   Locator("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
                        singleLineFieldName: "SingleLine",
                        outFields: ["Addr_type"],
                        name: "Search",
                        localSearchOptions: {
                            minScale: 300000,
                            distance: 50000
                        },
                        placeholder: "Search Street Address",
                        highlightSymbol: new PictureMarkerSymbol("img/search-pointer.png", 36, 36).setOffset(9, 18)
                    }
                ],
                map: map2,
                zoomScale: 5000000000
            }, "searchStreetAddress2");

            searchStreetAddress2.startup();

            var symbol2 = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0]),2);

            var symbol = new SimpleFillSymbol( SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,112,255,255]), 2),new Color([173,216,230]));

            mapLayer.setRenderer(new SimpleRenderer(symbol));
            map2.removeLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer");
            map2.addLayer(mapLayer);

            var regionObject = $filter('filter')($scope.regionData, { region : $scope.regionpick});
            var startExtent = new Extent();
            startExtent.xmin = regionObject[0].minpointx;
            startExtent.ymin = regionObject[0].minpointy;
            startExtent.xmax = regionObject[0].maxpointx;
            startExtent.ymax = regionObject[0].maxpointy;
            map2.setExtent(startExtent);

            var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0, 197, 255, 0.35]), 1),new Color([ 0, 197, 255, 0.35]));

            map2.on("load", function(){
                map2.graphics.enableMouseEvents();

                var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0");
                var query = new esri.tasks.Query();
                query.returnGeometry = true;
                query.where = "Name = '" + $scope.regionpick + "'";

                queryTask.execute(query, function(result){
                    for (var i=0, il=result.features.length; i<il; i++) {

                        var graphic = result.features[i];

                        graphic.setSymbol(highlightSymbol);
             
                        map2.graphics.add(graphic);
                    }
                });

                var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color("#191165"), 1),new Color([ 0, 197, 255, 0.35]));

                var highlightGraphic = new Graphic($scope.regionGraphic.geometry,highlightSymbol);
                map2.graphics.add(highlightGraphic);

                map2.graphics.on("mouse-out", function() {
                    map2.graphics.clear();
                    map2.infoWindow.hide();
                });

                mapLayer.on("mouse-over", function(evt){
                    var t = "<b>${name}</b>";
                    var content = esriLang.substitute(evt.graphic.attributes,t);
                    var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
                    map2.graphics.add(highlightGraphic);
                    map2.infoWindow.setContent(content);
                    map2.infoWindow.setTitle("Neighborhood");
                    map2.infoWindow.show(evt.screenPoint,map2.getInfoWindowAnchor(evt.screenPoint));
                });
            });

            var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Neighborhoods_LAT_2017_NDSC/FeatureServer/0");
            var query = new esri.tasks.Query();
            query.returnGeometry = true;
            query.outFields = ["name"];

            map2.on("click", function(evt){
                $scope.regionGraphic = evt.graphic;
                query.geometry = evt.mapPoint;
                queryTask.execute(query, function(result){
                    $scope.regionpick = result.features[0].attributes.name;
                    $scope.neighborhoodmap($scope.regionpick);

                    window.location.href = 'neighborhoodmap.html';
                })
            });
        });
    }

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
            "esri/dijit/Search",
            "esri/symbols/PictureMarkerSymbol",
            "esri/tasks/locator",
            "dojo/domReady!"
        ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, QueryTask, Query,Search,PictureMarkerSymbol,Locator) {

            var labelField = "Name";
            var statesColor = new Color("#191165");
            var statesLine = new SimpleLineSymbol("solid", statesColor, 1.5);
            var statesSymbol = new SimpleFillSymbol("solid", statesLine, null);
            var statesRenderer = new SimpleRenderer(statesSymbol);

            var statesUrl = "http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0";

            var info = new esri.InfoTemplate();
            info.setTitle("Region");
            info.setContent("${Name}");

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

            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,112,255,255]), 2), new Color([173,216,230]));

            states.setRenderer(new SimpleRenderer(symbol));

            map.removeLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/0");
            map.addLayer(states);

            var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color("#191165"), 1), new Color([ 0, 197, 255]));

            map.on("load", function(){
                map.graphics.enableMouseEvents();
            });

            map.graphics.on("mouse-out", function() {
                map.graphics.clear();
                map.infoWindow.hide();
            });

            states.on("mouse-over", function(evt){
                var t = "<b>${Name}</b>";
                var content = esriLang.substitute(evt.graphic.attributes,t);
                var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
                map.graphics.add(highlightGraphic);
                map.infoWindow.setContent(content);
                map.infoWindow.setTitle("Region");
                map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
            });

            var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0");
            var query = new esri.tasks.Query();
            query.returnGeometry = true;
            query.outFields = ["name"];

            map.on("click", function(evt){
                $scope.regionGraphic = evt.graphic;
                query.geometry = evt.mapPoint;
                queryTask.execute(query, function(result){
                    $scope.regionpick = result.features[0].attributes.Name;
                    $('#mapCarousel').carousel('next');
                    $scope.regionMap();
                })
            });

            var searchRegionName = new Search({
                sources: [
                    {
                        featureLayer:states,
                        outFields:["Name"],
                        displayField: "Name",
                        suggestionTemplate: "${Name}",
                        name: "Search",
                        placeholder: "Search Region Name",
                        enableSuggestions: true
                    }
                ],
                map: map
            }, "searchRegionName");

            searchRegionName.startup();

            var searchStreetAddress1 = new Search({
                sources: [
                    {
                        locator: new Locator("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
                        singleLineFieldName: "SingleLine",
                        outFields: ["Addr_type"],
                        name: "Search",
                        localSearchOptions: {
                            minScale: 300000,
                            distance: 50000
                        },
                        placeholder: "Search Street Address",
                        highlightSymbol: new PictureMarkerSymbol("img/search-pointer.png", 36, 36).setOffset(9, 18)
                    }
                ],
                map: map,
                zoomScale: 5000000000
            }, "searchStreetAddress1");

            searchStreetAddress1.startup();
    }); 
  }; 
});
