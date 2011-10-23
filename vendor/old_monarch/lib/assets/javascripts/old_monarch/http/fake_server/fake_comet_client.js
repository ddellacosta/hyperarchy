_.constructor("OldMonarch.Http.FakeServer.FakeCometClient", {
  initialize: function() {
    this.onReceiveNode = new OldMonarch.SubscriptionNode();
    this.connected = false;
  },
  
  connect: function() {
    this.connecting = true;
    this.connectFuture = new OldMonarch.Http.AjaxFuture();
    return this.connectFuture;
  },

  onReceive: function(callback, context) {
    return this.onReceiveNode.subscribe(callback, context);
  },

  simulateReceive: function(message) {
    this.onReceiveNode.publish(message);
  },

  simulateConnectSuccess: function(clientId) {
    this.clientId = clientId;
    this.connecting = false;
    this.connected = true;
    this.connectFuture.triggerSuccess();
    delete this.connectFuture;
  }
});
