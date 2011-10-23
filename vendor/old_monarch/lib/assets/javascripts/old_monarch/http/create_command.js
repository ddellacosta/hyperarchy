(function(OldMonarch) {

_.constructor("OldMonarch.Http.CreateCommand", OldMonarch.Http.Command, {
  initialize: function($super, record, server) {
    $super(record, server);
    this.table = this.record.table;
    this.tableName = this.table.globalName;
    this.fieldValues = record.dirtyWireRepresentation();
  },

  wireRepresentation: function() {
    return ['create', this.tableName, this.fieldValues];
  },

  complete: function(fieldValuesFromServer) {
    this.record.created(fieldValuesFromServer);
  },

  handleFailure: function(errorsByFieldName) {
    if (errorsByFieldName) this.record.assignValidationErrors(errorsByFieldName);
  }
});

})(OldMonarch);
