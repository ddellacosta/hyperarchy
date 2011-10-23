(function(OldMonarch) {

_.constructor("OldMonarch.Model.ProjectedColumn", {
  initialize: function(column, columnAlias) {
    this.column = column;
    this.columnAlias = columnAlias;
  },

  name: function() {
    return this.columnAlias || this.column.name;
  },

  eq: function(rightOperand) {
    return new OldMonarch.Model.Predicates.Eq(this, rightOperand);
  },

  asc: function() {
    return new OldMonarch.Model.SortSpecification(this, 'asc');
  },

  desc: function() {
    return new OldMonarch.Model.SortSpecification(this, 'desc');
  }
});

})(OldMonarch);
