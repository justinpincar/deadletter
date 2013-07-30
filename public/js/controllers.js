'use strict';

/* Controllers */

function NavCtrl($scope, $location) {
  $scope.selectedTab = $location.path().substring(1, $location.path().length);
  $scope.changeView = function(hash) {
    $scope.selectedTab = hash;
    $location.path(hash);
    return false;
  };
}

function AboutCtrl($scope, $http) {}

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

  openpgp.init();
  $scope.isCreating = false;
  $scope.alias = '';
  $scope.password = '';
  $scope.publicKey = '';
  $scope.deadletterDropUrl = window.location.protocol + "//" + window.location.host + "/#/d/deadletter";
  $scope.hasBeenCreated = false;

  var canSubmit = function() {
    var fieldsPresent = !(($scope.alias.length < 1) || ($scope.password.length < 1) || ($scope.publicKey.length < 1));
    if (!fieldsPresent) {
      $scope.error = "Please fill out all fields.";
      return false;
    }

    try {
      var pubKey = openpgp.read_publicKey($scope.publicKey)[0];
      if (pubKey.validate()) {
        return true;
      } else {
        $scope.error = "PGP public key is invalid.";
        return false;
      }
    } catch(err) {
      $scope.error = "PGP public key is invalid.";
      return false;
    }
  }

  $scope.isCreateDropDisabled = function() {
    return ($scope.hasBeenCreated || $scope.isCreating);
  };

  $scope.createDrop = function() {
    $('#drop-error').fadeOut();

    if (!canSubmit()) {
      $('#drop-error').fadeIn();
      return false;
    }

    var hashedPassword = CryptoJS.SHA3($scope.password).toString();

    $scope.isCreating = true;
    $http({
      method : 'POST',
      url : '/users',
      data : {
        alias: $scope.alias,
        password: hashedPassword,
        publicKey: $scope.publicKey
      }
    }).success(function() {
      $("#drop-success").fadeIn();
      $scope.hasBeenCreated = true;
      $scope.isCreating = false;
    }).error(function(data) {
      $scope.error = data;
      $("#drop-error").fadeIn();
      $scope.isCreating = false;
    });

    return false;
  };

  $scope.encrypt = function() {
    openpgp.init();
    var pub_key = openpgp.read_publicKey($('#pubkey').text());
    $('#message').val(openpgp.write_encrypted_message(pub_key,$('#message').val()));
    window.alert("This message is going to be sent:\n" + $('#message').val());
    return false;
  };
}

