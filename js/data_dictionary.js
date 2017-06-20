var menuApp = angular.module('menuApp', ['ui.filters']);
			menuApp.controller("menuController", function ($scope, $http,$filter) {
			var lookup = {};
			var items;
			var result = [];
                
            //correct this
			$('#radio').attr('checked',true);

			var refresh = function() {
				$http({
					method: 'GET',
					url: ' http://b4fa31bb.ngrok.io/GS-Variables'
				}).then(function (response){

				  $scope.menus = response.data.data;			 
				  
				  $scope.newmenu = $scope.menus;

				  items = angular.copy($scope.menus);
				  for (var item, i = 0; item = items[i++];) {
				  var name = item.policyarea;
					if (!(name in lookup) && name!=null && name!=="") {
						lookup[name] = 1;
						result.push(name);
					}
				  }
				    
                    //unique policy name 
                    $scope.uniquePolicyName = result;                     
                    $scope.flag = 1;
					
                    
                   

				});

                //dont know what this code does, we an remove it i guess 
				$http({
					method: 'GET',
					url: ' http://b4fa31bb.ngrok.io/GS-Main'
				}).then(function (response){
					$scope.main = response.data.data;
					$scope.selectedYear;
				});
			  };
			  
                
                refresh();





			  $scope.popup = function(variab){
			  	$scope.newVar = variab;
			  	var years = [];
				for (var p=0; p<$scope.main.length; p++){
					if($scope.main[p]['variable'] == variab)
						years.push($scope.main[p]);

				}
				 $scope.yearss = years;
                  console.log("years");
                  console.log($scope.yearss);
			  }

              
              /*
              
			  $scope.yearSelected = function(variab,yr){
					console.log("year is selected");
                  //console.log("Var ",variab);
					//console.log("year ",yr);
					for (var p1=0; p1<$scope.main.length; p1++){
						if($scope.main[p1]['variable'] == variab && $scope.main[p1]['year'] == yr){
							$scope.downloadLink = $scope.main[p1]['open-dataurl'];
							console.log($scope.downloadLink);
							break;
						}
					}

			  }
              
              */

			  $scope.sort = function(value) {

					if(value == 1)
					{
					$scope.flag = 1;
					}
					if(value == 2)
					{
					
                        
					$scope.flag = 2;                        
					$scope.newmenu = angular.copy($scope.menus);
					$scope.newmenu.sort(function(a, b){
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

				$scope.groupByPolicyName = function(policyAreaName){
                    
					var filteredData = [];
					filteredData = $filter('filter')($scope.menus, {'policyarea' : policyAreaName});                    
					return filteredData;

				}
			});