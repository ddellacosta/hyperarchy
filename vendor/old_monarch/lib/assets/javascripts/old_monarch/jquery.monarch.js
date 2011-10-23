(function(OldMonarch, jQuery) {

jQuery.fn.extend({
  appendView: function(contentFn) {
    this.append(OldMonarch.View.build(contentFn));
    return this;
  },

  view: function() {
    return this.data('view');
  },

  fieldValues: function() {
    var values = {};
    this.find("input,select,textarea").filter(":visible").each(function() {
      var elt = jQuery(this);
      var name = elt.attr('name');
      if (!name) return;
      if (elt.is(':checkbox')) {
        values[name] = elt.attr('checked');
      } else {
        values[name] = elt.val();
      }
    });

    if (this.customFieldValues) {
      jQuery.extend(values, this.customFieldValues());
    }

    return values;
  },

  bindText: function(record, fieldName) {
    var subscription = this.data('bindTextSubscription');
    if (subscription) subscription.destroy();
    var field = record.getRemoteField(fieldName);
    if (!field) throw new Error("No field named " + fieldName + " found.");
    this.text(field.getValue());

    var subscription = field.onChange(function(newValue) {
      this.text(newValue);
    }, this);
    this.data('bindTextSubscription', subscription);

    this.attr('textIsBound', true);
  },

  fillVerticalSpace: function(parent) {
    var bottomOfParentInsidePadding = parent.outerHeight() - parseInt(parent.css('padding-bottom'));
    this.height(bottomOfParentInsidePadding - this.position().top);
  }
});

})(OldMonarch, jQuery);
