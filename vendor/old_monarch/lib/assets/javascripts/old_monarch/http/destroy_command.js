(function(OldMonarch) {

_.constructor("OldMonarch.Http.DestroyCommand", OldMonarch.Http.Command, {
  initialize: function($super, record, server) {
    $super(record, server);
    this.tableName = record.table.globalName;
    this.id = record.id();
  },

  wireRepresentation: function() {
    return ['destroy', this.tableName, this.id];
  },

  complete: function() {
    this.record.destroyed();
  },

  handleFailure: function() {
  }
});

})(OldMonarch);
