_.constructor("OldMonarch.Http.FakeServer.FakeUnsubscribe", {
  type: "unsubscribe",
  
  initialize: function(url, remoteSubscriptions, fakeServer) {
    this.url = url;
    this.remoteSubscriptions = remoteSubscriptions;
    this.future = new OldMonarch.Http.AjaxFuture();
    this.fakeServer = fakeServer;
  },

  simulateSuccess: function() {
    this.future.triggerSuccess("");
    this.fakeServer.removeRequest(this);
  }
});
