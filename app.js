'use strict';

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
    }
    $scope.users.push(obj);
    $scope.selected = ($scope.users.length - 1);
  }

  $scope.selectConversation = function(index) {
    $scope.selected = index;

    $timeout(function() {
      msgDiv.scrollTop = msgDiv.scrollHeight;
    }, 0);
  }

  $scope.send = function() {
    if($scope.newMessage === "") { return }
    console.log($scope.users[$scope.selected].alias);

    $scope.sending = true;
    melange.createMessage({
      to: [{
        alias: $scope.users[$scope.selected].alias,
      }],
      name: "chat/" + normalize($scope.newMessage, $scope.users[$scope.selected].alias),
      date: (new Date()).toISOString(),
      public: false,
      components: {
        "airdispat.ch/chat/body": {string: $scope.newMessage},
      },
    }, melange.angularCallback($scope, function(status) {
      $scope.sending = false;

      $scope.users[$scope.selected].messages.unshift({
        sender: true,
        message: {
          string: $scope.newMessage,
        },
      });

      $timeout(function() {
        msgDiv.scrollTop = msgDiv.scrollHeight;
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

msgApp.filter('parseUrl', function() {
  var replaceTP = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  var replaceWWW = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

  return function(text, target) {
    angular.forEach(text.match(replaceTP), function(url) {
      text = text.replace(replaceTP, "<a href=\"$1\" target=\"_blank\">$1</a>");
    });
    angular.forEach(text.match(replaceTP), function(url) {
      text = text.replace(replaceTP, "$1<a href=\"$2\" target=\"_blank\">$2</a>");
    });

    return text;
  };
});
