//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

User = Monarch("User", {
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
})
  .syntheticColumn('fullName', function() {
    return this.signal('firstName', 'lastName', function(firstName, lastName) {
      return firstName + " " + lastName;
    });
  })

  .hasMany('votes')
  .hasMany('rankings')
  .hasMany('answers', {foreignKey: 'creatorId'})
  .hasMany('questions', {foreignKey: 'creatorId'})
  .hasMany('memberships')
  .hasMany('questionVisits')
  .hasMany('organizations', {through: 'memberships'})
  .relatesTo('organizationsPermittedToInvite', function() {
    return this.memberships().where({role: "owner"}).joinThrough(Organization)
      .union(this.organizations().where({membersCanInvite: true}));
  })

  .include({
    isCurrent: function() {
      return Application.currentUserId == this.id();
    },

    fetchAvatarUrl: function(size) {
      if (this.facebookId()) {
        return new OldMonarch.Promise().triggerSuccess(this.facebookAvatarUrl());
      } else if (this.twitterId()) {
        return this.fetchTwitterAvatarUrl();
      } else {
        return new OldMonarch.Promise().triggerSuccess(this.gravatarUrl());
      }
    },

    facebookAvatarUrl: function() {
      return "https://graph.facebook.com/" + this.facebookId() + "/picture?type=square";
    },

    fetchTwitterAvatarUrl: function() {
      if (this.fetchTwitterAvatarUrlPromise) return this.fetchTwitterAvatarUrlPromise;
      var promise = new OldMonarch.Promise();
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

    defaultOrganization: function() {
      return this.memberships().orderBy('lastVisited desc').first().organization();
    },

    rankingsForQuestion: function(question) {
      return this.rankings().where({questionId: question.id()});
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

