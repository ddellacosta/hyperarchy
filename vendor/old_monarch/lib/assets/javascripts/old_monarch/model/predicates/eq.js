(function(OldMonarch) {

_.constructor("OldMonarch.Model.Predicates.Eq", OldMonarch.Model.Predicates.Binary, {
  operator: function(left, right) {
    return left == right;
  },

  type: "eq",

  forceMatchingFieldValues: function(fieldValues) {
    var matchingFieldValues = _.clone(fieldValues);
    matchingFieldValues[this.columnOperand().name] = this.scalarOperand();
    return matchingFieldValues;
  }
});

})(OldMonarch);
