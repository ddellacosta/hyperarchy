_.constructor("AgendaItem", Model.Record, {
  constructorInitialize: function() {
    this.columns({
      questionId: 'key',
      creatorId: 'key',
      body: 'string',
      details: 'string',
      position: 'integer',
      createdAt: 'datetime',
      noteCount: 'integer'
    });

    this.defaultOrderBy('position asc');

    this.hasMany('rankings');
    this.hasMany('notes', {constructorName: "AgendaItemNote"});
    this.belongsTo('question');
    this.belongsTo('creator', {constructorName: "User"});
    this.relatesToMany('noters', function() {
      return this.notes().join(User).on(AgendaItemNote.creatorId.eq(User.id));
    });
  },

  afterInitialize: function() {
    this.rankingsByUsers = {};
  },

  afterRemoteDestroy: function() {
    this.rankings().each(function(ranking) {
      ranking.remotelyDestroyed();
    });
  },

  rankingByUser: function(user) {
    var relation = this.rankingsByUsers[user.id()];
    if (relation) return relation;
    return this.rankingsByUsers[user.id()] = this.rankings().where({userId: user.id()});
  },

  rankingByCurrentUser: function() {
    if (!Application.currentUser()) throw new Error("There is no current user");
    return this.rankingByUser(Application.currentUser());
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
    return $.PHPDate("M j, Y @ g:ia", this.createdAt());
  },

  url: function() {
    return "/questions/" + this.questionId() + "/agenda_items/" + this.id();
  },

  fullScreenUrl: function() {
    return this.url() + "/full_screen";
  },

  mixpanelNote: function() {
    return this.body();
  },

  previous: function() {
    return this.question().agendaItems().where(AgendaItem.position.lt(this.position())).last();
  },

  next: function() {
    return this.question().agendaItems().where(AgendaItem.position.gt(this.position())).first();
  }
});
