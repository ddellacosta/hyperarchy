jasmine.StringPrettyPrinter.prototype.emitObject = function(obj) {
  var self = this;

  var inspectMethodNames = ['inspect', 'toString', 'toJSON'];
  var methodName = _.find(inspectMethodNames, function(methodName) { return _.isFunction(obj[methodName]); });
  if (methodName) { return self.format(obj[methodName]()); }

  this.append('{ ');
  var first = true;

  this.iterateObject(obj, function(property, isGetter) {
    if (!obj.hasOwnProperty(property)) return;
    if (first) {
      first = false;
    } else {
      self.append(', ');
    }

    self.append(property);
    self.append(' : ');
    if (isGetter) {
      self.append('<getter>');
    } else {
      self.format(obj[property]);
    }
  });

  this.append(' }');
};

jasmine.Env.prototype.equals_ = function(a, b, mismatchKeys, mismatchValues) {
  return _.isEqual(a, b);
};

jasmine.Matchers.prototype.toBeEmpty = function(a) {
  return this.actual.length === 0;
}
