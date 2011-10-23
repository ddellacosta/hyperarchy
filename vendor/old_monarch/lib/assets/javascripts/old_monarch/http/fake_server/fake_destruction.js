_.constructor("OldMonarch.Http.FakeServer.FakeDestruction", {
  type: 'destroy',

  initialize: function(fakeServer, record) {
    this.fakeServer = fakeServer;
    this.record = record;
    this.promise = new OldMonarch.Promise();
  },

  simulateSuccess: function() {
    this.fakeServer.removeRequest(this);
    this.record.destroyed();
    this.promise.triggerSuccess(this.record);
  }
});
