_.constructor("Views.ColumnLayout.CommentLi", View.Template, {
  content: function() {with(this.builder) {
    div({'class': "commentLi"}, function() {
      div({'class': "body"}).ref("body");
      button('delete', {'class': "delete"}).
        ref("deleteButton").
        click("deleteComment");
      div({'class': "creator"}, function() {
        subview('avatar', Views.Avatar, {size: 35});
        span({'class': "name"}).ref("creatorName");
        br();
        span({'class': "date"}).ref("createdAt");
      });
      div({'class': "clear"});
    });
  }},

  viewProperties: {
    initialize: function() {
      this.creatorName.html(this.comment.creator().fullName());
      this.body.html(this.comment.body());
      this.avatar.user(this.comment.creator());
      this.createdAt.html(this.comment.formattedCreatedAt());
      this.showOrHideDeleteButton();
    },

    showOrHideDeleteButton: function() {
      if (this.comment.editableByCurrentUser()) {
        this.deleteButton.show();
      } else {
        this.deleteButton.hide();
      }
    },

    deleteComment: function() {
      this.comment.destroy();
    }
  }
});
