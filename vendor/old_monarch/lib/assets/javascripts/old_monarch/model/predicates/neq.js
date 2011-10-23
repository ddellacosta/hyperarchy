(function(OldMonarch) {

_.constructor("OldMonarch.Model.Predicates.Neq", OldMonarch.Model.Predicates.Binary, {
  operator: function(left, right) {
    return left != right;
  },

  type: "neq"
});

})(OldMonarch);
