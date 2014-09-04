'use strict';

var moveArray = function(arr, old_index, new_index) {
    while (old_index < 0) {
        old_index += arr.length;
    }
    while (new_index < 0) {
        new_index += arr.length;
    }
    if (new_index >= arr.length) {
        var k = new_index - arr.length;
        while ((k--) + 1) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing purposes
};

var numbers = function(str) {
  var res = 0,
  len = str.length;
  for (var i = 0; i < len; i++) {
    res = ((res * 31 + str.charCodeAt(i)) % 65537);
  }
  return res;
}

var normalize = function(body, to) {
  return numbers(to) + "-" + numbers(body) + "-" + (new Date()).getTime();
}

var msgApp = angular.module('msgApp', []);

msgApp.controller('messagesCtrl', ["$scope", "$timeout", function($scope, $timeout) {
  $scope.newMessage = "";

  $scope.loading = true;
  melange.findMessages(["airdispat.ch/chat/body", "?airdispat.ch/chat/data"], undefined, melange.angularCallback($scope, function(data) {
    var users = {};
    console.log(data);
    for(var i in data) {
      var k = data[i];

      var key = "";
      var profile = {};

      if(k["self"]) {
        key = k.to[0].fingerprint;
        profile = k.to[0];
      } else {
        key = k.from.fingerprint;
        profile = k.from;
      }

      if(users[key] === undefined) {
        users[key] = {
          name: profile.name,
          alias: profile.alias,
          fingerprint: profile.fingerprint,
          messages: [],
        }
      }

      users[key].messages.push({
        sender: k["self"],
        message: k.components["airdispat.ch/chat/body"],
        timestamp: k.date,
      });
    }

    var output = [];

    // We should do some sorting here.
    for (var i in users) {
      output.push(users[i])
    }

    $scope.loading = false;
    $scope.users = output;
  }));

  var msgDiv = document.getElementById("messages");

  $scope.newConversation = function() {
    var obj = {
      name: "",
      messages: [],
      isNew: true,
    }
    // $scope.users.push(obj);
    // $scope.selected = ($scope.users.length - 1);
    $scope.selected = obj;
    $scope.selectedIndex = -1;
  }

  $scope.selectConversation = function(index, obj) {
    $scope.selected = obj;
    $scope.selectedIndex = index;

    $timeout(function() {
      msgDiv.scrollTop = msgDiv.scrollHeight;
    }, 0);
  }

  $scope.send = function() {
    if($scope.newMessage === "") { return }
    console.log($scope.selected.alias);

    if($scope.selected.isNew === true) {
      $scope.users.unshift($scope.selected);
      $scope.selectedIndex = 0;
    } else {
      moveArray($scope.users, $scope.selectedIndex, 0)
      $scope.selectedIndex = 0;
    }

    $scope.sending = true;
    melange.createMessage({
      to: [{
        alias: $scope.selected.alias,
      }],
      name: "chat/" + normalize($scope.newMessage, $scope.selected.alias),
      date: (new Date()).toISOString(),
      public: false,
      components: {
        "airdispat.ch/chat/body": {string: $scope.newMessage},
      },
    }, melange.angularCallback($scope, function(status) {
      $scope.sending = false;

      $scope.selected.messages.unshift({
        sender: true,
        message: {
          string: $scope.newMessage,
        },
      });

      $timeout(function() {
        msgDiv.scrollTop = msgDiv.scrollHeight;
        document.getElementById("newMessageText").focus();
      }, 0);

      $scope.newMessage = "";
    }));
  }

}]);

msgApp.filter('reverse', function() {
  return function(items) {
    if (!angular.isArray(items)) return [];
    return items ? items.slice().reverse() : [];
  };
});
