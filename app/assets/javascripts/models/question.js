_.constructor("Question", Model.Record, {
  constructorProperties: {
    initialize: function() {
      this.columns({
        teamId: 'key',
        creatorId: 'key',
        body: 'string',
        details: 'string',
        voteCount: 'integer',
        score: 'float',
        updatedAt: 'datetime',
        createdAt: 'datetime'
      });

      this.defaultOrderBy('score desc');

      this.hasMany('agendaItems');
      this.hasMany('votes', {orderBy: 'updatedAt desc'});
      this.hasMany('notes', {constructorName: 'QuestionNote'});
      this.relatesToMany('noters', function() {
        return this.notes().join(User).on(QuestionNote.creatorId.eq(User.id));
      });

      this.hasMany('questionVisits');
      this.relatesToMany('voters', function() {
        return this.votes().joinThrough(User);
      });

      this.hasMany('rankings', {orderBy: 'position desc'});

      this.belongsTo('team');
      this.belongsTo('creator', {constructorName: 'User'});
    },

    scoreUpdateInterval: 60000,

    updateScoresPeriodically: function() {
      setInterval(this.hitch('updateScores'), this.scoreUpdateInterval);
    },

    updateScores: function() {
      var queue = new Monarch.Queue(10);
      this.each(function(question) {
        queue.add(question.hitch('updateScore'));
      });
      queue.start();
    }
  },

  afterInitialize: function() {
    this.rankingsByUserId = {};
    this.rankedAgendaItemsByUserId = {};
    this.unrankedAgendaItemsByUserId = {};
  },

  rankingsForUser: function(user) {
    var userId = user.id();
    if (this.rankingsByUserId[userId]) return this.rankingsByUserId[userId];
    return this.rankingsByUserId[userId] = this.rankings().where({userId: userId}).orderBy(Ranking.position.desc());
  },

  rankingsForCurrentUser: function() {
    return this.rankingsForUser(Application.currentUser());
  },

  positiveRankingsForCurrentUser: function() {
    return this.rankingsForCurrentUser().where(Ranking.position.gt(0));
  },

  rankedAgendaItemsForUser: function(user) {
    var userId = user.id();
    if (this.rankedAgendaItemsByUserId[userId]) return this.rankedAgendaItemsByUserId[userId];
    return this.rankedAgendaItemsByUserId[userId] = this.rankingsForUser(user).joinThrough(AgendaItem);
  },

  editableByCurrentUser: function() {
    return Application.currentUser().admin() || this.belongsToCurrentUser() || this.team().currentUserIsOwner();
  },

  belongsToCurrentUser: function() {
    return this.creator() === Application.currentUser();
  },

  unrankedAgendaItemsForUser: function(user) {
    var userId = user.id();
    if (this.unrankedAgendaItemsByUserId[userId]) return this.unrankedAgendaItemsByUserId[userId];
    return this.unrankedAgendaItemsByUserId[userId] = this.agendaItems().difference(this.rankedAgendaItemsForUser(user));
  },

  currentUsersVisit: function() {
    return this.questionVisits().find({userId: Application.currentUserId});
  },

  fetchVotes: function() {
    return Server.fetch(this.votes(), this.voters());
  },

  fetchNotesAndNotersIfNeeded: function() {
    if (this.noteFetchFuture) {
      return this.noteFetchFuture;
    } else {
      return this.noteFetchFuture =
        this.agendaItems()
          .joinThrough(AgendaItemNote)
          .join(User).on(AgendaItemNote.creatorId.eq(User.id))
          .fetch();
    }
  },

  formattedCreatedAt: function() {
    return $.PHPDate("M j, Y @ g:ia", this.createdAt());
  },

  updateScore: function() {
    this.remotelyUpdated({score: this.computeScore()});
  },

  computeScore: function() {
    return (this.voteCount() + Question.SCORE_EXTRA_HOURS) / Math.pow(this.ageInHours() + Question.SCORE_EXTRA_HOURS, Question.SCORE_GRAVITY);
  },

  ageInHours: function() {
    return (new Date().getTime() - this.createdAt().getTime()) / 3600000
  },

  url: function() {
    return "/questions/" + this.id();
  },

  absoluteUrl: function() {
    return Application.origin() + this.url();
  },

  fullScreenUrl: function() {
    return this.url() + "/full_screen";
  },

  newAgendaItemUrl: function() {
    return this.url() + "/agenda_items/new";
  },

  shareOnFacebook: function() {
    var agendaItems = this.positiveRankingsForCurrentUser().limit(3).joinThrough(AgendaItem);
    var numAgendaItems = agendaItems.size();
    var currentUserName = Application.currentUser().fullName();

    var caption, description;
    switch (numAgendaItems) {
      case 0:
        caption = this.noRankingsShareCaption;
        break;
      case 1:
        caption = currentUserName + "'s top agendaItem:";
        break;
      default:
        caption = currentUserName + "'s top agendaItems:";
    }

    if (numAgendaItems > 0) {
      var numerals = ["⑴", "⑵", "⑶"];
      description = agendaItems.inject("", function(description, agendaItem, i) {
        return description + " " + numerals[i] + " " + agendaItem.body();
      });
    }

    var shareCode = Application.randomString();

    FB.ui({
      method: 'feed',
      name: this.body(),
      link: this.absoluteUrl() + "?s=" + shareCode,
      caption: caption,
      description: description
    }, this.bind(function(response) {
      if (response && response.post_id) {
        this.recordShare('facebook', shareCode);
        mpq.push(['track', 'Facebook Post', this.mixpanelProperties()]);
      } else {
        mpq.push(['track', 'Cancel Facebook Post', this.mixpanelProperties()]);
      }
    }));
  },

  twitterIntentsUrlAndCode: function() {
    var shareCode = Application.randomString();
    var queryString = $.param({
      url: this.absoluteUrl() + "?s=" + shareCode,
      related: "actionitems",
      text: this.body()
    });

    return ["https://twitter.com/intent/tweet?" + queryString, shareCode];
  },

  recordShare: function(service, shareCode) {
    $.post("/shares", {
      question_id: this.id(),
      service: service,
      code: shareCode
    });
  },

  mixpanelNote: function() {
    return this.body()
  },

  noRankingsShareCaption: "Click on this question to suggest and rank agendaItems."
});