'use strict';

/* App Module */

angular.module('whisper', []).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'partials/notes.html', controller: NotesCtrl}).
    when('/n/:salt/:pepper', {templateUrl: 'partials/note.html', controller: NoteCtrl}).
    when('/about', {templateUrl: 'partials/about.html', controller: AboutCtrl}).
    when('/users', {templateUrl: 'partials/users.html', controller: UsersCtrl}).
    otherwise({redirectTo: '/'});
}]);


var randomString = function(length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i=length; i>0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return result;
};

