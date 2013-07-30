'use strict';

/* App Module */

if ((window.location.host == "deadletter.io") && (window.location.protocol != "https:")) {
  window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
}

$(window).on('load', function() {
   $("#cover").fadeOut();
});

var deadletter = angular.module('whisper', [], function($httpProvider) {
  var handlerFactory = function($q, $timeout) {
    return function(promise) {
      return promise.then(function(response) {
        return $timeout(function() {
          return response;
        }, 3000);
      }, function(response) {
        return $timeout(function() {
          return $q.reject(response);
        }, 3000);
      });
    };
  }

  $httpProvider.responseInterceptors.push(handlerFactory);
}).
  config(['$routeProvider', '$anchorScrollProvider', function($routeProvider, $anchorScrollProvider) {
  $routeProvider.
    when('/', {templateUrl: 'partials/notes.html', controller: NotesCtrl}).
    when('/n/:salt/:pepper', {templateUrl: 'partials/note.html', controller: NoteCtrl}).
    when('/about', {templateUrl: 'partials/about.html', controller: AboutCtrl}).
    when('/drop', {templateUrl: 'partials/users.html', controller: UsersCtrl}).
    otherwise({redirectTo: '/'});
  $anchorScrollProvider.disableAutoScrolling();
}]).value('$anchorScroll', angular.noop);

deadletter.run(function($rootScope) {
  $rootScope.isViewLoading = false;
  $rootScope.$on('$routeChangeStart', function() {
    $rootScope.isViewLoading = true;
  });
  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.isViewLoading = false;
  });

  $rootScope.select = function($event) {
    var el = $event.currentTarget;
    el.select();
  };
});

var randomString = function(length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i=length; i>0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return result;
};

