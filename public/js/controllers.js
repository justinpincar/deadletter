'use strict';

/* Controllers */

function NavCtrl($scope, $location) {
  $scope.selectedTab = $location.path().substring(1, $location.path().length);
  $scope.changeView = function(hash) {
    $scope.selectedTab = hash;
    $location.path(hash);
  };
}

function AboutCtrl($scope, $http) {

}

function NotesCtrl($scope, $http) {
  $scope.hasBeenSent = false;
  $scope.text = '';
  $scope.isSendDisabled = function() {
    return ($scope.hasBeenSent || ($scope.text.length == 0));
  };
  $scope.salt = randomString(64);
  $scope.pepper = randomString(64);
  $scope.sendNote = function() {
    $scope.isSending = true;
    $scope.hasBeenSent = true;

    var key = $scope.salt + $scope.pepper;
    var text = $scope.text;
    var encrypted = CryptoJS.AES.encrypt(text, key).toString();
    $scope.text = encrypted;

    $http({
      method : 'POST',
      url : '/notes',
      data : {
        salt: $scope.salt,
        encrypted: encrypted
      }
    }).success(function() {
      var noteUrl = window.location.protocol + "//" + window.location.host + "/#/n/" + $scope.salt + "/" + $scope.pepper;
      $("#note-success input").val(noteUrl);
      $("#note-success").fadeIn();
      $scope.isSending = false;
    }).error(function() {
      $("#note-error").fadeIn();
      $scope.isSending = false;
    });

    return false;
  };
  $scope.select = function($event) {
    var el = $event.currentTarget;
    el.select();
  };
}

function NoteCtrl($scope, $http, $routeParams, $timeout) {
  $scope.salt = $routeParams.salt;
  $scope.pepper = $routeParams.pepper;
  $scope.error = null;
  var key = $scope.salt + $scope.pepper;

  var noteError = function() {
    $("#note-error").fadeIn();
    $scope.error = "Unable to decrypt note. Please ask the sender to provide you with another URL.";
  };

  $scope.isLoading = true;
  $http({
    method : 'GET',
    url : '/notes/' + $scope.salt
  }).success(function(data) {
    $scope.encrypted = data.encrypted;
    $scope.decrypted = CryptoJS.AES.decrypt($scope.encrypted, key).toString(CryptoJS.enc.Utf8);
    $scope.isLoading = false;
    if ($scope.decrypted.length > 0) {
      $timeout(function() {
        $("textarea").height( $("textarea")[0].scrollHeight );
      });
    } else {
      noteError();
    }
  }).error(function() {
    noteError();
    $scope.isLoading = false;
  });
}

function UsersCtrl($scope, $http) {
  if (!window.crypto || !window.crypto.getRandomValues) {
    window.alert("Error: Browser not supported\nReason: We need a cryptographically secure PRNG to be implemented (i.e. the window.crypto method)\nSolution: Use Chrome >= 11, Safari >= 3.1 or Firefox >= 21");
    return;
  }

  $scope.encrypt = function() {
    openpgp.init();
    var pub_key = openpgp.read_publicKey($('#pubkey').text());
    $('#message').val(openpgp.write_encrypted_message(pub_key,$('#message').val()));
    window.alert("This message is going to be sent:\n" + $('#message').val());
    return false;
  };
}

