(function(OldMonarch) {

_.constructor("OldMonarch.Model.Field", {
  onUpdate: function(updateCallback, context) {
    if (!this.onUpdateNode) this.onUpdateNode = new OldMonarch.SubscriptionNode();
    return this.onUpdateNode.subscribe(updateCallback, context);
  },

  valueIsEqual: function(value) {
    return _.isEqual(this.value(), this.column.convertValueForField(value));
  }
});

})(OldMonarch);
