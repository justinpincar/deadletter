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
  $scope.deadDropUrl = function() {
    return window.location.protocol + "//" + window.location.host + "/#/d/" + $scope.alias;
  };

  var canSubmit = function() {
    var fieldsPresent = !(($scope.alias.length < 1) || ($scope.password.length < 1) || ($scope.publicKey.length < 1));
    if (!fieldsPresent) {
      $scope.error = "Please fill out all fields.";
      return false;
    }

    if (!$scope.alias.match(/^[0-9a-zA-Z_-]+$/)) {
      $scope.error = "Alias must be alphanumeric.";
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
}

function UserCtrl($scope, $http, $routeParams) {
  if (!window.crypto || !window.crypto.getRandomValues) {
    window.alert("Error: Browser not supported\nReason: We need a cryptographically secure PRNG to be implemented (i.e. the window.crypto method)\nSolution: Use Chrome >= 11, Safari >= 3.1 or Firefox >= 21");
    return;
  }

  $scope.alias = $routeParams.alias;
  $scope.text = '';
  $scope.hasBeenSent = false;
  $scope.isSending = false;
  $scope.isSendDisabled = function() {
    return ($scope.hasBeenSent || ($scope.text.length == 0));
  };

  $scope.loginUrl = function() {
    return window.location.protocol + "//" + window.location.host + "/#/l/" + $scope.alias;
  };

  var noteError = function() {
    $("#drop-error").fadeIn();
    $scope.error = "Unable to access dead drop. Please check your URL."
  };

  $scope.isLoading = true;
  $http({
    method : 'GET',
    url : '/users/' + $scope.alias
  }).success(function(data) {
    $scope.publicKey = data.publicKey;
    $scope.isLoading = false;
    if ($scope.publicKey.length > 0) {

    } else {
      noteError();
    }
  }).error(function() {
    noteError();
    $scope.isLoading = false;
  });

  $scope.sendNote = function() {
    $scope.isSending = true;
    $scope.hasBeenSent = true;

    try {
      openpgp.init();
      var pub_key = openpgp.read_publicKey($scope.publicKey)[0];
      var encrypted = openpgp.write_encrypted_message(pub_key, $scope.text);
      $scope.text = encrypted;
    } catch (err) {
      $scope.isSending = false;
      $scope.error = "Error: Unable to encrypt note.";
      $("#note-error").fadeIn();
      return;
    }

    $http({
      method : 'POST',
      url : '/letters',
      data : {
        alias: $scope.alias,
        encrypted: encrypted
      }
    }).success(function() {
      $("#note-success").fadeIn();
      $scope.isSending = false;
    }).error(function() {
      $scope.error = "Error: Unable to send note.";
      $("#note-error").fadeIn();
      $scope.isSending = false;
    });

    return false;
  };
}

function LoginCtrl($rootScope, $scope, $http, $routeParams, $location) {
  $scope.alias = $routeParams.alias;
  $scope.password = '';
  $scope.isLoginDisabled = false;

  $scope.signIn = function() {
    $scope.isLoginDisabled = true;
    $("#auth-error").fadeOut();

    var hashedPassword = CryptoJS.SHA3($scope.password).toString();

    $http({
      method : 'POST',
      url : '/users/auth',
      data : {
        alias: $scope.alias,
        password: hashedPassword
      }
    }).success(function() {
      $rootScope.isAuthenticated = true;
      $rootScope.alias = $scope.alias;
      $rootScope.passwordHash = hashedPassword;
      $location.path('m');
    }).error(function() {
      $scope.isLoginDisabled = false;
      $("#auth-error").fadeIn();
      $scope.isSending = false;
    });

    return false;
  };
}

function MessagesCtrl($scope, $location, $http) {
  // TODO: Remove test authentication
  $scope.isAuthenticated = true;
  $scope.alias = 'deadletter';
  $scope.passwordHash = "838235ab36f78648e7c5563c64676fd8d2fb205c75c2cf4d3203bc2ff30fa66e4fb91ce446946152bcf538ffc5c6d6d234ab3c8a638c8c7fc7d2c8a8c63d25ee";

  $scope.isLoading = true;

  if (!$scope.isAuthenticated) {
    $location.path('l/');
    return;
  }

  $scope.selectedLetter = null;
  $scope.letters = [];

  $http({
    method: 'GET',
    url: '/letters?alias=' + $scope.alias + '&password=' + $scope.passwordHash
  }).success(function(letters) {
    for (var i=0; i<letters.length; i++) {
      var letter = letters[i];
      letter.deleteText = "Delete";
      letter.deleteInitialized = false;
    }

    $scope.letters = letters;
    $scope.isLoading = false;
  }).error(function() {
    $location.path('l/');
    return;
  });

  $scope.formattedCreatedAt = function(createdAt) {
    return (new Date(createdAt)).toISOString();
  };

  $scope.selectLetter = function(letter) {
    if ($scope.selectedLetter) {
      $scope.selectedLetter.deleteText = "Delete";
      $scope.selectedLetter.deleteInitialized = false;
    }

    $scope.selectedLetter = letter;
    return false;
  };

  $scope.deadDropUrl = window.location.protocol + "//" + window.location.host + "/#/d/" + $scope.alias;

  $scope.deleteLetter = function($event, letter)  {
    $event.stopPropagation();

    if (letter.deleteInitialized) {
      var i;
      for (i=0; i<$scope.letters.length; i++) {
        var tempLetter = $scope.letters[i];
        if (tempLetter.id == letter.id) {
          break;
        }
      }
      letter.isDeleting = true;

      $http({
        method : 'POST',
        url : '/letters/' + letter.id + '/destroy',
        data : {
          alias: $scope.alias,
          password: $scope.passwordHash
        }
      }).success(function() {
        $scope.letters.splice(i, 1);
        $scope.selectedLetter = null;
      }).error(function() {
        alert("Error, refreshing page.");
        window.location.reload();
      });
    } else {
      letter.deleteInitialized = true;
      letter.deleteText = "Confirm delete?";
    }

    return false;
  };
}

