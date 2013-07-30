'use strict';

/* App Module */

var deadletter = angular.module('whisper', [], function($httpProvider) {
  // var handlerFactory = function($q, $timeout) {
    // return function(promise) {
      // return promise.then(function(response) {
        // return $timeout(function() {
          // return response;
        // }, 3000);
      // }, function(response) {
        // return $q.reject(response);
      // });
    // };
  // }

  // $httpProvider.responseInterceptors.push(handlerFactory);
}).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'partials/notes.html', controller: NotesCtrl}).
    when('/n/:salt/:pepper', {templateUrl: 'partials/note.html', controller: NoteCtrl}).
    when('/about', {templateUrl: 'partials/about.html', controller: AboutCtrl}).
    when('/users', {templateUrl: 'partials/users.html', controller: UsersCtrl}).
    otherwise({redirectTo: '/'});
}]);

deadletter.run(function($rootScope) {
  $rootScope.isViewLoading = false;
  $rootScope.$on('$routeChangeStart', function() {
    $rootScope.isViewLoading = true;
  });
  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.isViewLoading = false;
  });
});

var randomString = function(length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i=length; i>0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return result;
};

