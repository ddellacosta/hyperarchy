_.constructor("QuestionNote", Model.Record, {
  constructorInitialize: function() {
    this.columns({
      questionId: 'key',
      creatorId: 'key',
      body: 'string',
      updatedAt: 'datetime',
      createdAt: 'datetime'
    });

    this.belongsTo('question');
    this.belongsTo('creator', {constructorName: "User"});
  },

  belongsToCurrentUser: function() {
    return this.creator() === Application.currentUser();
  },

  editableByCurrentUser: function() {
    return Application.currentUser().admin() || this.belongsToCurrentUser() || this.team().currentUserIsOwner();
  },

  team: function() {
    return this.question().team();
  },

  formattedCreatedAt: function() {
    return $.PHPDate("n/j/y g:ia", this.createdAt());
  },

  mixpanelNote: function() {
    return this.body();
  }
});
