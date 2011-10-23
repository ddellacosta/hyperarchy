(function(OldMonarch) {

_.constructor("OldMonarch.Model.ConcreteField", OldMonarch.Model.Field, {
  value: {
    writer: function(value, version) {
      value = this.column.convertValueForField(value);
      if (_.isEqual(this.value(), value)) return;
      var oldValue = this._value;
      this._value = value;
      this.valueAssigned(this._value, oldValue, version);
    }
  }
});

})(OldMonarch);
