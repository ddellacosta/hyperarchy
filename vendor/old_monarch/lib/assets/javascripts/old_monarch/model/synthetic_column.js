(function(OldMonarch) {

_.constructor("OldMonarch.Model.SyntheticColumn", OldMonarch.Model.Column, {
  initialize: function(table, name, definition) {
    this.table = table;
    this.name = name;
    this.definition = definition;
  }
});

})(OldMonarch);
