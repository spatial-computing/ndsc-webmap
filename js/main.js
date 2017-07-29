'use strict';

var app = angular.module('myModule', ['angular.filter','esri.map']);
app.controller('myController', function($scope,$http,$filter) {
    
    function getMain(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Main'
        });
    }

    function getCarousel(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Carousel'
        });
    }
    
    function getRegions(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Region'
        });
    }

    function getNeighborhood(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Neighborhood'
        });
    }
    
    function getDatasets(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Datasets'
        });
    }

    function getVariables(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Variables'
        });
    }
    
    function getComposite(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Composite'
        });
    }

    function getPolicy(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Policy'
        });
    }
    
    function getTooltips(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-Tooltips'
        });
    }

    function getAbout(){
        return $http({
            method: 'GET',
            url: 'http://6370bd5f.ngrok.io/GS-About'
        });
    }
    
    function fetchData() {
        getMain().then(function(result1) {
            $scope.main = result1.data.data;

            getCarousel().then(function(result2) {
                $scope.carousel = result2.data.data;

                getRegion().then(function(result3) {
                    $scope.region = result3.data.data;

                    getNeighborhood().then(function(result4) {
                        $scope.neighborhood = result4.data.data;

                        getDatasets().then(function(result5) {
                            $scope.datasets = result5.data.data;

                            getVariables().then(function(result6) {
                                $scope.variables = result6.data.data;

                                getComposite().then(function(result7) {
                                    $scope.composite = result7.data.data;

                                    getPolicy().then(function(result8) {
                                        $scope.policy = result8.data.data;

                                        getTooltips().then(function(result9) {
                                            $scope.tooltips = result9.data.data;

                                            getAbout().then(function(result10) {
                                                $scope.about = result10.data.data;

                                                mainFunc();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    
    function mainFunc() {
        var lookup = {};
        var items;

        $scope.getVar2 = function(menuD){
            $scope.datasetSelected = menuD;
            for (var p=0;p<$scope.variables.length;p++)
            {
                if($scope.variables[p]['dataset'] == menuD)
                {
                    $scope.learnabout = $scope.variables[p]['learnvariableaboutthevariableondashboard'];
                }
            }

            $('#myCarousel').carousel('next');
        };

        $scope.back = function() {
            $('#myCarousel').carousel('prev');
        };

        $scope.getDts = function(menuPA) {
            $scope.menuDtsList = $filter('filter')($scope.main, { policyarea : menuPA.policyarea });
            $scope.pa = menuPA.policyarea;
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

        $scope.CIMap = function(ci){
            if(ci=='eco') {
                $scope.CIData = $scope.composite[0];
            }
            else if (ci=='risk') {
                $scope.CIData = $scope.composite[1];
            }
            else if (ci=='conn') {
                $scope.CIData = $scope.composite[2];
            }
            sessionStorage.CImapStore =  JSON.stringify($scope.CIData);
        };

        $scope.sendDomain = function(topic){
            $scope.menuRes = topic;
            $scope.menuDomain = $filter('filter')($scope.main, { policyarea : topic});
        };

        $scope.sendVariable = function(topic){
            $scope.menuVariable = $filter('filter')($scope.menuDomain, { dataset : topic.dataset});
        };   
        
        $scope.showDiv = (function (selected_policy,policy) {
            $scope.selected_policy_area=selected_policy.policyarea;
            $scope.policy=policy;
            angular.forEach($scope.policy, function(x){
                $scope.area=x.policyarea;
                $scope.st=$scope.area.replace(/\s/g,"");
                $scope.display=$scope.st.replace("&","");
                document.getElementById($scope.display).style.display='none';
                document.getElementById('mainContent').style.display='none';
            });

            $scope.str=$scope.selected_policy_area.replace(/\s/g,"");
            $scope.string=$scope.str.replace("&","");
            document.getElementById($scope.string).style.display='block';
        });
    }
    
    fetchData();
}