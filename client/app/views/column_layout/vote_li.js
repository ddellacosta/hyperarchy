_.constructor("Views.ColumnLayout.VoteLi", View.Template, {
  content: function(attrs) { with(this.builder) {
    div({'class': "personLi", 'style': "display: none;"}, function() {
      subview('avatar', Views.Avatar, { size: 40 });
      span({'class': "name"}, "").ref('name');
      br();
      span({'class': "date"}, "").ref('votedAt');
      div({'class': "icon"}).ref('icon');
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

      this.name.html(htmlEscape(user.fullName()));
      this.avatar.user(user);
      this.updateVotedAt();
      this.show();
      this.attr("userId", this.vote.userId());
    },

    updateVotedAt: function() {
      this.votedAt.html(this.vote.formattedUpdatedAt());
    },

    showRanking: function() {
      this.containingView.showOtherRanking(this.vote.userId());
    }
  }
});