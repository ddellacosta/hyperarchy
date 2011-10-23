//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

Organization = Monarch("Organization", {
  name: "string",
  description: "string",
  membersCanInvite: "boolean",
  questionCount: 'integer',
  memberCount: 'integer',
  useSsl: 'boolean',
  social: 'boolean',
  privacy: 'string',
  membershipCode: 'string'
})
  .hasMany("questions")
  .hasMany("answers", {through: "questions"})
  .hasMany("votes", {through: "questions"})
  .hasMany("memberships", {orderBy: ["firstName asc", "emailAddress asc"]})
  .relatesTo("members", {through: "memberships", className: "User"})

  .extend({
    findSocial: function() {
      return this.find({social: true});
    }
  })

  .include({
    afterInitialize: function() {
      this.numQuestionsFetched = 0;
    },

    subscribe: function(data) {
      $.post('/channel_subscriptions/organizations/' + this.id(), data);
    },

    fetchMoreQuestions: function() {
      if (this.fetchInProgressFuture) return this.fetchInProgressFuture;

      if (this.numQuestionsFetched >= this.questionCount()) {
        var promise = new OldMonarch.Promise();
        promise.triggerSuccess();
        return promise;
      }

      // if we already fetched some, fetch 8 positions back to account for unseen swapping at the fringe
      var offset, limit;
      if (this.numQuestionsFetched > 0) {
        offset = this.numQuestionsFetched - 8;
        limit = 24;
      } else {
        offset = 0;
        limit = 16;
      }

      var promise = $.ajax({
        url: "/questions",
        data: {
          organization_id: this.id(),
          offset: offset,
          limit: limit
        },
        dataType: 'records'
      });

      this.fetchInProgressFuture = promise;
      promise.success(this.bind(function() {
        delete this.fetchInProgressFuture;
        this.numQuestionsFetched += 16;
      }));

      return promise;
    },

    membershipForUser: function(user) {
      return this.memberships().find({userId: user.id()});
    },

    membershipForCurrentUser: function() {
      return this.membershipForUser(Application.currentUser());
    },

    currentUserIsMember: function() {
      return this.membershipForCurrentUser() != null;
    },

    currentUserIsOwner: function() {
      var currentUserMembership = this.memberships().find({userId: Application.currentUserId()});
      if (!currentUserMembership) return false;
      return currentUserMembership.role() === "owner";
    },

    ensureCurrentUserCanParticipate: function() {
      var future = new OldMonarch.Http.AjaxFuture();
      if (!this.isPublic() && !this.currentUserIsMember()) {
        Application.layout.mustBeMemberMessage.show();
        future.triggerFailure();
      } else if (Application.currentUser().guest()) {
        Application.layout.signupPrompt.future = future;
        Application.layout.signupPrompt.showSignupForm();
        Application.layout.signupPrompt.show()
      } else {
        future.triggerSuccess();
      }
      return future;
    },

    currentUserCanParticipate: function() {
      return !Application.currentUser().guest() && (this.isPublic() || this.currentUserIsMember());
    },

    currentUserCanEdit: function() {
      return Application.currentUser().admin() || this.currentUserIsOwner();
    },

    currentUserCanInvite: function() {
      return this.currentUserIsOwner() || (this.currentUserIsMember() && this.membersCanInvite());
    },

    isPublic: function() {
      return this.privacy() === "public";
    },

    isPrivate: function() {
      return this.privacy() === "private";
    },

    hasNonAdminQuestions: function() {
      return !this.questions().where(Question.creatorId.neq(1)).empty();
    },

    url: function() {
      return "/organizations/" + this.id();
    },

    settingsUrl: function() {
      return this.url() + "/settings";
    },

    newQuestionUrl: function() {
      return this.url() + "/questions/new";
    },

    secretUrl: function() {
      return 'https://' + window.location.hostname + "/access/" + this.id() + "/" + this.membershipCode();
    },

    mixpanelNote: function() {
      return this.name();
    }
  });

