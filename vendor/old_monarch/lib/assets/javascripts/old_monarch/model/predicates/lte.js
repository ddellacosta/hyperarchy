(function(OldMonarch) {

_.constructor("OldMonarch.Model.Predicates.Lte", OldMonarch.Model.Predicates.Binary, {
  operator: function(left, right) {
    return left <= right;
  },

  type: "lte",

  forceMatchingFieldValues: function(fieldValues) {
    throw new Error("Can only force a field value for equality predicates");
  }
});

})(OldMonarch);
