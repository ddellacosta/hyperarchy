Monarch.Record.include({
  mixpanelProperties: function() {
    var properties = this.wireRepresentation();
    var note = this.mixpanelNote();
    if (note) properties = _.extend(properties, {mp_note: note});
    return properties;
  },

  trackView: function() {
    mpq.push(["track", "View " + this.constructor.displayName, this.mixpanelProperties()]);
  },

  trackCreate: function() {
    mpq.push(["track", "Create " + this.constructor.displayName, this.mixpanelProperties()]);
  },

  trackUpdate: function() {
    mpq.push(["track", "Update " + this.constructor.displayName, this.mixpanelProperties()]);
  },

  mixpanelNote: function() {}
});

