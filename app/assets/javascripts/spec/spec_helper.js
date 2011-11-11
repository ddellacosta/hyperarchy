//= require application
//= require_directory ./support
//= require monarch_test_support

var ajaxRequests;
var originalAjax = jQuery.ajax;
jQuery.ajax = function() {
  var jqXhr = originalAjax.apply(this, arguments);
  ajaxRequests.push(jqXhr);
  return jqXhr;
};

var originalServer = window.Server;

Views.Pages.Question.AnswerLi.prototype.viewProperties.dragDelay = null;

var mpq;
var _gaq;

beforeEach(function() {
  ajaxRequests = [];
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
  window.History.reset();
  Monarch.Repository.clear();
  stubAjax();
  spyOn(Question, 'updateScoresPeriodically');
  mpq = []
  _gaq = [];
  T.reset();
  twttr.events.reset();
});

afterEach(function() {
  if (window.Application) {
    window.Application.remove();
  }

  _.each(ajaxRequests, function(xhr) {
    xhr.abort();
  });
  ajaxRequests = [];
  Monarch.restoreOriginalServer();
//  $('#jasmine_content').empty();
});

var socketClient;

function attachLayout(render) {
  spyOn(io.Socket.prototype, 'connect').andCallFake(function() {
    socketClient = this;
  });
  window.Application = Views.Layout.toView();
  if (render) $("#jasmine_content").html(window.Application = Views.Layout.toView());
  Application.attach();
  var socialOrg = Organization.created({id: 999, social: true, name: "Hyperarchy Social"});
  var defaultGuest = socialOrg.makeMember({id: 999, guest: true, defaultGuest: true, firstName: "Default", lastName: "Guest"});
  Application.currentUser(defaultGuest);
  Path.listen();
  return Application;
}

function renderLayout() {
  return attachLayout(true);
}

var mostRecentAjaxDeferred, mostRecentAjaxRequest;
function stubAjax() {
  spyOn(jQuery, 'ajax').andCallFake(function(request) {
    mostRecentAjaxRequest = request;
    mostRecentAjaxDeferred = jQuery.Deferred();
    var promise = mostRecentAjaxDeferred.promise();
    promise.success = promise.done;
    return promise;
  });
}

function enableAjax() {
  window.Server = originalServer;
  jQuery.ajax = jQuery.ajax.originalValue;
  clearServerTables();
}

var originalServer;
function useFakeServer(auto) {
  Monarch.useFakeServer()
  window.Server = new OldMonarch.Http.FakeServer();
  window.Server.auto = auto;
}

function unspy(object, methodName) {
  object[methodName] = object[methodName].originalValue;
}

function simulateAjaxSuccess(data) {
  if (!mostRecentAjaxRequest) throw new Error("No outstanding ajax request");
  if (mostRecentAjaxRequest.success) mostRecentAjaxRequest.success(data);
  mostRecentAjaxDeferred.resolve(data);
}

function expectMixpanelAction(action, name) {
  var events = _.select(mpq, function(event) { return event[0] === action && event[1] === name});
  expect(events.length).toBe(1);
  return events[0];
}

var FB = {
  login: function() {},
  api: function() {},
  ui: function() {}
};

var T = {
  signIn: function() {},

  reset: function() {
    this.subscriptionNodes = {};
  },

  bind: function(eventName, callback) {
    this.getEventNode(eventName).subscribe(callback);
  },

  one: function(eventName, callback) {
    var subscription = this.getEventNode(eventName).subscribe(function() {
      callback.apply(window, arguments);
      subscription.destroy();
    });
  },

  getEventNode: function(eventName) {
    var node = this.subscriptionNodes[eventName];
    if (node) {
      return node;
    } else {
      return this.subscriptionNodes[eventName] = new OldMonarch.SubscriptionNode();
    }
  },

  trigger: function() {
    var args = _.toArray(arguments);
    var eventName = args.shift();
    this.getEventNode(eventName).publishArgs(args);
  }
};

var twttr = {
  events: {
    reset: function() {
      this.nodes = {};
    },

    bind: function(type, callback) {
      if (!this.nodes[type]) this.nodes[type] = new OldMonarch.SubscriptionNode();
      this.nodes[type].subscribe(callback);
    },

    trigger: function(type, data) {
      if (this.nodes[type]) this.nodes[type].publish(data);
    }
  }
}
