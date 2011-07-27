_.constructor("Membership", Model.Record, {
  constructorInitialize: function() {
    this.columns({
      teamId: "key",
      userId: "key",
      role: "string",
      firstName: "string",
      lastName: "string",
      emailAddress: "string",
      lastVisited: "datetime",
      notifyOfNewMeetings: "string",
      notifyOfNewAgendaItems: "string",
      notifyOfNewNotesOnOwnAgendaItems: "string",
      notifyOfNewNotesOnRankedAgendaItems: "string"
    });

    this.belongsTo("team");
    this.belongsTo("user");
  },

  fullName: function() {
    if (this.firstName() && this.lastName()) {
      return this.firstName() + " " + this.lastName();
    } else {
      return null;
    }
  }
});
