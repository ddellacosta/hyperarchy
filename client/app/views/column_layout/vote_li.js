_.constructor("Views.ColumnLayout.VoteLi", View.Template, {
  content: function(attrs) { with(this.builder) {
    div({'class': "voteLi", 'style': "display: none;"}, function() {
      subview('avatar', Views.Avatar, { size: 40});
      div({'class': "name"}, "").ref('name');
      span({'class': "date"}, "").ref('votedAt');
      div({'class': "clear"});
    }).click('showRanking');
  }},
  
  viewProperties: {
    initialize: function() {
      var user = this.vote.user();
      if (!user) {
        User.fetch(this.vote.userId()).onSuccess(function() {
          this.initialize();
        }, this);
        return;
      }

      this.avatar.user(user);
      this.name.html(htmlEscape(user.fullName()));
      this.updateVotedAt();
      this.show();
      this.attr("userId", this.vote.userId());
    },

    updateVotedAt: function() {
      this.votedAt.html(this.vote.formattedUpdatedAt());
    },

    showRanking: function() {
      var userId = this.vote.userId();
      if (userId == Application.currentUserId) {
        $.bbq.removeState("userId");
      } else {
        $.bbq.pushState({userId: userId});
      }
    }
  }
});
