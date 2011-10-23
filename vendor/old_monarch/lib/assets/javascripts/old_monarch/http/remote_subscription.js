(function(OldMonarch) {

_.constructor("OldMonarch.Http.RemoteSubscription", {
  initialize: function(subscriptionId, relation) {
    this.id = subscriptionId;
    this.relation = relation;
  },

  destroy: function() {
    return Server.unsubscribe([this]);
  }
});

})(OldMonarch);
