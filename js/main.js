var app = angular.module('myModule', ['angular.filter','esri.map']);
app.controller('myController', function($scope,$http,$filter) {

  var lookup = {};
  var items;
  var result = [];

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

  var refresh = function() {
    $http({
        method: 'GET',
        url: ' http://6370bd5f.ngrok.io/GS-Main'
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
        url: '  http://6370bd5f.ngrok.io/GS-Carousel'
    }).then(function (response) {
        $scope.carousel = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-Region'
    }).then(function (response) {
        $scope.region = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-Neighborhood'
    }).then(function (response) {
        $scope.neighborhood = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-Datasets'
    }).then(function (response) {
        $scope.datasets = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-Variables'
    }).then(function (response) {
        $scope.variables = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-Composite'
    }).then(function (response) {
        $scope.composite = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-Policy'
    }).then(function (response) {
        $scope.policy = response.data.data;
        $scope.showDiv = (function (selected_policy,policy)
            {
				console.log("inside display");
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
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-Tooltips'
    }).then(function (response) {
        $scope.tooltips = response.data.data;
    },function(err){
        console.log(err);
    });

    $http({
        method: 'GET',
        url: '  http://6370bd5f.ngrok.io/GS-About'
    }).then(function (response) {
        $scope.about = response.data.data;
    },function(err){
        console.log(err);
    });
  };

  refresh();

});
