var app = angular.module('myModule', ['angular.filter','esri.map']);
app.controller('myController', function($scope,$http) {

  var refresh = function() {
    $http({
        method: 'GET',
        url: 'http://localhost:3000/GS-Main'
    }).then(function (response) {
        $scope.main = response.data.data;
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
