jasmine.PrettyPrinter.prototype.format = function(value) {
  if (this.ppNestLevel_ > 2) return;

  this.ppNestLevel_++;
  try {
    if (value === jasmine.undefined) {
      this.emitScalar('undefined');
    } else if (value === null) {
      this.emitScalar('null');
    } else if (value === jasmine.getGlobal()) {
      this.emitScalar('<global>');
    } else if (value instanceof jasmine.Matchers.Any) {
      this.emitScalar(value.toString());
    } else if (typeof value === 'string') {
      this.emitString(value);
    } else if (jasmine.isSpy(value)) {
      this.emitScalar("spy on " + value.identity);
    } else if (value instanceof RegExp) {
      this.emitScalar(value.toString());
    } else if (typeof value === 'function') {
      this.emitScalar('Function');
    } else if (typeof value.nodeType === 'number') {
      this.emitScalar('HTMLNode');
    } else if (value instanceof Date) {
      this.emitScalar('Date(' + value + ')');
    } else if (value.__Jasmine_been_here_before__) {
      this.emitScalar('<circular reference: ' + (jasmine.isArray_(value) ? 'Array' : 'Object') + '>');
    } else if (jasmine.isArray_(value) || typeof value == 'object') {
      value.__Jasmine_been_here_before__ = true;
      if (jasmine.isArray_(value)) {
        this.emitArray(value);
      } else {
        this.emitObject(value);
      }
      delete value.__Jasmine_been_here_before__;
    } else {
      this.emitScalar(value.toString());
    }
  } finally {
    this.ppNestLevel_--;
  }
};

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
