_.constructor("AgendaItemNote", Model.Record, {
  constructorInitialize: function() {
    this.columns({
      agendaItemId: 'key',
      creatorId: 'key',
      body: 'string',
      updatedAt: 'datetime',
      createdAt: 'datetime'
    });

    this.belongsTo('agendaItem');
    this.belongsTo('creator', {constructorName: "User"});
  },

  belongsToCurrentUser: function() {
    return this.creator() === Application.currentUser();
  },

  editableByCurrentUser: function() {
    return Application.currentUser().admin() || this.belongsToCurrentUser() || this.team().currentUserIsOwner();
  },

  team: function() {
    return this.meeting().team();
  },

  meeting: function() {
    return this.agendaItem().meeting();
  },

  formattedCreatedAt: function() {
    return $.PHPDate("n/j/y g:ia", this.createdAt());
  },

  mixpanelNote: function() {
    return this.body();
  }
});
