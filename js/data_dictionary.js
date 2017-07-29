'use strict';

angular.module('menuApp', ['ui.filters'])
    .controller('menuController', function($scope, $http, $filter) {
    
    var lookup = {};
    var items;
    var result = [];
    
    $scope.inputBtnValue=1;
    
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
        $scope.menu = $scope.variables;

        items = angular.copy($scope.variables);
        for (var item, i = 0; item = items[i++];) {
            var name = item.policyarea;
            if (!(name in lookup) && name!=null && name!=="") {
                lookup[name] = 1;
                result.push(name);
            }
        }
				    
        $scope.uniquePolicyName = result;                     
        $scope.flag = 1;
        
        $scope.popUp = function(variab) {
            $scope.newVar = variab;
            var years = $filter('filter')($scope.main, {'variable' : variab});  
            $scope.yearss = years;
        }
        
        $scope.downloadLink = function(sel) {
            if(sel==1) {
                var selOption = document.getElementById("sel1");
                var strUser = selOption.options[selOption.selectedIndex].text;
                if(strUser != "Select a Value") {
                    var mapUrl = $filter('filter')($scope.yearss, {'year' : strUser});
                    var jsonURL = mapUrl[0]["feature-serviceurl"] + "?f=pjson";
                    getJSON(jsonURL).then(function(result) {
                        $scope.jsonData = result.data;
                        $scope.downloadURL = "https://opendata.arcgis.com/datasets/" + $scope.jsonData.serviceItemId + "_0.csv";
                        window.location = $scope.downloadURL;
                    });
                }
            }
            else {
                var selOption = document.getElementById("sel2");
                var strUser = selOption.options[selOption.selectedIndex].text;
                if(strUser != "Select a Value") {
                    var mapUrl = $filter('filter')($scope.yearss, {'year' : strUser});
                    var jsonURL = mapUrl[0]["feature-serviceurl"] + "?f=pjson";
                    getJSON(jsonURL).then(function(result) {
                        $scope.jsonData = result.data;
                        $scope.downloadURL = "https://opendata.arcgis.com/datasets/" + $scope.jsonData.serviceItemId + "_0.csv";
                        window.location = $scope.downloadURL;
                    });
                }
            }
        }
        
        $scope.sort = function(value) {

            if(value == 1)
            {
                $scope.flag = 1;
            }
            if(value == 2)
            {                        
                $scope.flag = 2;                        
                $scope.menu = angular.copy($scope.variables);
                $scope.menu.sort(function(a, b){
                    a = a['dataset'];
                    b = b['dataset'];
                    //need to modify this function 
                    if (a < b)
                        return -1;
					if (a > b)
						return 1;
                    return 0;
                });
            }
        }
        
        $scope.groupByPolicyName = function(policyAreaName) {
            var filteredData = [];
            filteredData = $filter('filter')($scope.variables, {'policyarea' : policyAreaName});                    
            return filteredData;
        }
    }
    
    fetchData();
});