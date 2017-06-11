var app = angular.module('myModule', ['angular.filter','esri.map']);
app.controller('myController', function($scope,$http,$filter) {

  var lookup = {};
  var items;
  var result = [];

  $scope.back = function() {
    $('#myCarousel').carousel('prev');
  };

  $scope.getDts = function(menuPA) {
    $scope.menuDtsList = $filter('filter')($scope.main, { policyarea : menuPA.policyarea });
    $('#myCarousel').carousel('next');
  };

  $scope.getVar = function(menuD){
    $scope.menuVarList = $filter('filter')($scope.menuDtsList, { dataset : menuD.dataset });
    $('#myCarousel').carousel('next');
  };

  $scope.dataMap = function(dataset){
    $scope.mapData = dataset;
    sessionStorage.mapStore =  JSON.stringify($scope.mapData);
    sessionStorage.mapYear =  JSON.stringify($scope.mapData.year);
  };

  $scope.sendDomain = function(topic){
    $scope.menuRes = topic;
    $scope.menuDomain = $filter('filter')($scope.main, { policyarea : topic});
  };

  $scope.sendVariable = function(topic){
    $scope.menuVariable = $filter('filter')($scope.menuDomain, { dataset : topic.dataset});
  };

  var refresh = function() {
    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Main'
    }).then(function (response) {
        $scope.main = response.data.data;
        items = angular.copy($scope.main);
        for (var item, i = 0; item = items[i++];) {
          var name = item.policyarea;

          if (!(name in lookup)) {
            lookup[name] = 1;
            result.push(name);
          }
        }
        $scope.left  = result.slice(0, Math.ceil(result.length/2));
        $scope.right = result.slice(Math.ceil(result.length/2), result.length);
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Carousel'
    }).then(function (response) {
        $scope.carousel = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Region'
    }).then(function (response) {
        $scope.region = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Neighborhood'
    }).then(function (response) {
        $scope.neighborhood = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Datasets'
    }).then(function (response) {
        $scope.datasets = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Variables'
    }).then(function (response) {
        $scope.variables = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Composite'
    }).then(function (response) {
        $scope.composite = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Policy'
    }).then(function (response) {
        $scope.policy = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Tooltips'
    }).then(function (response) {
        $scope.tooltips = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-About'
    }).then(function (response) {
        $scope.about = response.data.data;
    },function(err){
        console.log(err);
    });
  };

  refresh();

});
