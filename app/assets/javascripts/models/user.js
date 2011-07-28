_.constructor("User", Model.Record, {
  constructorInitialize: function() {
    this.columns({
      firstName: 'string',
      lastName: 'string',
      emailAddress: 'string',
      emailHash: 'string',
      admin: 'boolean',
      guest: 'boolean',
      defaultGuest: 'boolean',
      emailEnabled: 'boolean',
      facebookId: 'string',
      twitterId: 'integer'
    });

    this.syntheticColumn('fullName', function() {
      return this.signal('firstName').combine(this.signal('lastName'), function(firstName, lastName) {
        return firstName + " " + lastName;
      });
    });

    this.hasMany('votes');
    this.hasMany('rankings');
    this.hasMany('agendaItems', {key: 'creatorId'});
    this.hasMany('meetings', {key: 'creatorId'});
    this.hasMany('memberships');
    this.hasMany('meetingVisits');

    this.relatesToMany('teams', function() {
      return this.memberships().joinThrough(Team);
    });

    this.relatesToMany('teamsPermittedToInvite', function() {
      return this.memberships().where({role: "owner"}).joinThrough(Team)
        .union(this.teams().where({membersCanInvite: true}));
    });
  },

  isCurrent: function() {
    return Application.currentUserId == this.id();
  },

  fetchAvatarUrl: function(size) {
    if (this.facebookId()) {
      return new Monarch.Promise().triggerSuccess(this.facebookAvatarUrl());
    } else if (this.twitterId()) {
      return this.fetchTwitterAvatarUrl();
    } else {
      return new Monarch.Promise().triggerSuccess(this.gravatarUrl());
    }
  },

  facebookAvatarUrl: function() {
    return "https://graph.facebook.com/" + this.facebookId() + "/picture?type=square";
  },

  fetchTwitterAvatarUrl: function() {
    if (this.fetchTwitterAvatarUrlPromise) return this.fetchTwitterAvatarUrlPromise;
    var promise = new Monarch.Promise();
    this.fetchTwitterAvatarUrlPromise = promise
    $.ajax({
      type: 'get',
      dataType: 'jsonp',
      url: 'https://api.twitter.com/1/users/lookup.json',
      data: { user_id: this.twitterId() },
      success: function(response) {
        var biggerUrl = response[0].profile_image_url_https.replace("normal", "bigger");
        promise.triggerSuccess(biggerUrl);
      }
    });
    return promise;
  },

  gravatarUrl: function(size) {
    if (!size) size = 40;
    var baseUrl = "https://secure.gravatar.com";
    return baseUrl + "/avatar/" + this.emailHash() + "?s=" + size.toString() + "&d=404"
  },

  defaultTeam: function() {
    if (this.memberships().empty()) return null;
    return this.memberships().orderBy(Membership.lastVisited.desc()).first().team();
  },

  defaultPageUrl: function() {
    var defaultTeam = this.defaultTeam();
    return defaultTeam ? defaultTeam.url() : "/";
  },

  rankingsForMeeting: function(meeting) {
    return this.rankings().where({meetingId: meeting.id()});
  },

  trackIdentity: function() {
    if (this.guest()) return;
    mpq.push(['identify', this.id()]);
    mpq.push(['name_tag', this.fullName()]);
  },

  trackLogin: function() {
    if (this.guest()) return;
    mpq.push(['track', 'Login', this.mixpanelProperties()]);
  },
  
  mixpanelNote: function() {
    return this.fullName();
  }
});
