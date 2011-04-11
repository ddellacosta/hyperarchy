_.constructor("Views.ColumnLayout.VoteLi", View.Template, {
  content: function(attrs) { with(this.builder) {
    div({'class': "voteLi", 'style': "display: none;"}, function() {
      subview('avatar', Views.Avatar, { size: 40 });
//      span({'class': "name"}, "").ref('name');
      div({'class': "first name"}, "").ref('firstName');
      div({'class': "last name"}, "").ref('lastName');
//      br();
//      span({'class': "date"}, "").ref('votedAt');
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
      this.firstName.html(htmlEscape(user.firstName()));
      this.lastName.html(htmlEscape(user.lastName()));
      this.updateVotedAt();
      this.show();
      this.attr("userId", this.vote.userId());
    },

    updateVotedAt: function() {
//      this.votedAt.html(this.vote.formattedUpdatedAt());
    },

    showRanking: function() {
      this.containingView.showOtherRanking(this.vote.userId());
    }
  }
});