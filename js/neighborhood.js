'use strict';

angular.module('myModule', ['angular.filter','esri.map'])
    .controller('myController', function($scope, esriLoader, $filter, $http, $window) {

      var map2;
      $scope.mapFlag = 0;

      //get the data from neighborhood spreadsheet
      $http({
            method: 'GET',
            url: 'http://localhost:3000/GS-Neighborhood'
      }).then(function (response){
            $scope.neighborhood = response.data.data;
      });

      //get the data from region spreadsheet
      $http({
            method: 'GET',
            url: 'http://localhost:3000/GS-Region'
      }).then(function (response){
            $scope.regionData = response.data.data;
      });

      //function to move to next slide and set region selected
      $scope.neighborhoods = function(reg){
            $('#mapCarousel').carousel('next');
            $scope.regionpick = reg.region;
            $scope.regionMap();
      }

      //function to set the neigborhood in sessionStorage and go to the specific neighborhood page
      $scope.neighborhoodmap = function(dataset){
            $scope.mapdata = dataset;
            sessionStorage.nhood =  JSON.stringify($scope.mapdata);
            sessionStorage.variable = JSON.stringify("Median Household Income");
            sessionStorage.varUrl = JSON.stringify("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/Income_MedianHouseholdIncome_2015_NDSC/FeatureServer/0");
      };

      //draw the neighborhoods map on selecting region
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
      "dojo/domReady!"
      ], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
      TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, QueryTask, Query) {

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




    var labelField = "name";

    var nColor = new Color("#191165");
    var nLine = new SimpleLineSymbol("solid", nColor, 1.5);
    var nSymbol = new SimpleFillSymbol("solid", nLine, null);
    var nRenderer = new SimpleRenderer(nSymbol);

    var neighborhoodLabel = new TextSymbol().setColor(nColor);
    neighborhoodLabel.font.setSize("9pt");
    neighborhoodLabel.font.setFamily("arial");

    var json = {"labelExpressionInfo": {"value": "{name}"}
                };

    var labelClass = new LabelClass(json);
    labelClass.symbol = neighborhoodLabel;
    //mapLayer.setLabelingInfo([ labelClass ]);

    var symbol2 = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,new Color([0,0,0]),2);

    //regionMapLayer.setRenderer(new SimpleRenderer(symbol2));

    var symbol = new SimpleFillSymbol( SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                          new Color([0,112,255,255]),
                          2),new Color([173,216,230]));

    mapLayer.setRenderer(new SimpleRenderer(symbol));
    map2.removeLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer");
    map2.addLayer(mapLayer);
    map2.addLayer(regionMapLayer);

    var regionObject = $filter('filter')($scope.regionData, { region : $scope.regionpick});
    var startExtent = new Extent();
    startExtent.xmin = regionObject[0].minpointx;
    startExtent.ymin = regionObject[0].minpointy;
    startExtent.xmax = regionObject[0].maxpointx;
    startExtent.ymax = regionObject[0].maxpointy;
    map2.setExtent(startExtent);

    //set highlight symbol
    // var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(
    //                     SimpleLineSymbol.STYLE_SOLID,new Color("#191165"), 1),new Color([ 0, 197, 255]));

    var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(
                                          SimpleLineSymbol.STYLE_SOLID,new Color([0, 197, 255, 0.35]), 1),new Color([ 0, 197, 255, 0.35]));

    map2.on("load", function(){
              map2.graphics.enableMouseEvents();

              var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0");
              var query = new esri.tasks.Query();
              query.returnGeometry = true;
              query.where = "Name = '" + $scope.regionpick + "'";

              queryTask.execute(query, function(result){

              console.log(result.features[0]);


              //map2.graphics.clear();
              for (var i=0, il=result.features.length; i<il; i++) {

                var graphic = result.features[i];

                graphic.setSymbol(highlightSymbol);
              // var highlightGraphic = new Graphic(graphic.geometry,highlightSymbol);
              //console.log(highlightGraphic);

              map2.graphics.add(graphic);
              }

              // $scope.regionGraphic = result.features[0];
              // console.log($scope.regionGraphic.geometry);
              // var highlightGraphic = new Graphic($scope.regionGraphic.geometry,highlightSymbol);
              // map2.graphics.add(highlightGraphic);

             });

            var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(
                                                  SimpleLineSymbol.STYLE_SOLID,new Color("#191165"), 1),new Color([ 0, 197, 255, 0.35]));


            console.log($scope.regionGraphic.geometry);
            var highlightGraphic = new Graphic($scope.regionGraphic.geometry,highlightSymbol);
            map2.graphics.add(highlightGraphic);

        });//end of on load function

    // map2.graphics.on("mouse-out", function() {
    //           map2.graphics.clear();
    //           map2.infoWindow.hide();
    //         });


    // mapLayer.on("mouse-over", function(evt){
    //                   var t = "<b>${name}</b>";
    //                   var content = esriLang.substitute(evt.graphic.attributes,t);
    //                   var highlightGraphic = new Graphic(evt.graphic.geometry,highlightSymbol);
    //
    //                   map2.graphics.add(highlightGraphic);
    //                   map2.infoWindow.setContent(content);
    //                   map2.infoWindow.setTitle("Neighborhood");
    //                   map2.infoWindow.show(evt.screenPoint,map2.getInfoWindowAnchor(evt.screenPoint));
    //                 });

                    // var highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(
                    //                                     SimpleLineSymbol.STYLE_SOLID,new Color("#191165"), 1),new Color([ 0, 197, 255]));
                    //
                    //     //var content = esriLang.substitute(evt.graphic.attributes,t);
                    //     alert($scope.regionGraphic);
                    //     var highlightGraphic = new Graphic($scope.regionGraphic.geometry,highlightSymbol);
                    //
                    //     map2.graphics.add(highlightGraphic);



                });

              }





//draw the first region map
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
"dojo/domReady!"
], function(Map, Extent, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol,
TextSymbol, SimpleRenderer, LabelClass, Color, Graphic, esriLang, QueryTask, Query) {

//Setting labels for map
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


//get region selected on click
var queryTask = new esri.tasks.QueryTask("http://services1.arcgis.com/ZIL9uO234SBBPGL7/arcgis/rest/services/LA_County_Regions_LAT_2017_NDSC/FeatureServer/0");
var query = new esri.tasks.Query();
query.returnGeometry = true;
query.outFields = ["name"];

map.on("click", function(evt){
    //console.log(evt.graphic);
    $scope.regionGraphic = evt.graphic;
    query.geometry = evt.mapPoint;
    //console.log(evt.mapPoint);
    queryTask.execute(query, function(result){
    $scope.regionpick = result.features[0].attributes.Name;


    $('#mapCarousel').carousel('next');
    $scope.regionMap();
  })
});

    }); //esriLoader ends

  }; //onMapLoad ends

});//angular controller ends
