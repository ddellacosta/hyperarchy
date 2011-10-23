(function(OldMonarch) {

_.constructor("OldMonarch.Model.Predicates.Binary", OldMonarch.Model.Predicates.Predicate, {
  initialize: function(leftOperand, rightOperand) {
    this.leftOperand = leftOperand;
    this.rightOperand = rightOperand;
  },

  evaluate: function(tuple) {
    return this.operator(tuple.evaluate(this.leftOperand), tuple.evaluate(this.rightOperand));
  },

  wireRepresentation: function() {
    return {
      type: this.type,
      left_operand: this.operandWireRepresentation(this.leftOperand),
      right_operand: this.operandWireRepresentation(this.rightOperand)
    };
  },

  columnOperand: function() {
    if (this.leftOperand instanceof OldMonarch.Model.Column) {
      return this.leftOperand;
    } else if (this.rightOperand instanceof OldMonarch.Model.Column) {
      return this.rightOperand;
    } else {
      throw new Error("No operands are columns on this predicate");
    }
  },

  scalarOperand: function() {
    if (!(this.leftOperand instanceof OldMonarch.Model.Column)) {
      return this.leftOperand;
    } else if (!(this.rightOperand instanceof OldMonarch.Model.Column)) {
      return this.rightOperand;
    } else {
      throw new Error("No operands are scalars on this predicate");
    }
  },

  operandWireRepresentation: function(operand) {
    if (operand instanceof OldMonarch.Model.Column) {
      return operand.wireRepresentation();
    } else {
      return {
        type: 'scalar',
        value: operand
      };
    }
  },

  isEqual: function(other) {
    if (!(_.isFunction(other.isA) && other.isA(OldMonarch.Model.Predicates.Binary))) return false;
    return this.type === other.type &&
      _.isEqual(this.leftOperand, other.leftOperand) &&
        _.isEqual(this.rightOperand, other.rightOperand);
  }
});

})(OldMonarch);
