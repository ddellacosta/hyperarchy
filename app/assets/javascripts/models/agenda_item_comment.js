_.constructor("AgendaItemComment", Model.Record, {
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
    return Application.currentUser().admin() || this.belongsToCurrentUser() || this.organization().currentUserIsOwner();
  },

  organization: function() {
    return this.question().organization();
  },

  question: function() {
    return this.agendaItem().question();
  },

  formattedCreatedAt: function() {
    return $.PHPDate("n/j/y g:ia", this.createdAt());
  },

  mixpanelNote: function() {
    return this.body();
  }
});
