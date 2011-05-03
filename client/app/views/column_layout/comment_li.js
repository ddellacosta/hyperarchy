_.constructor("Views.ColumnLayout.CommentLi", View.Template, {
  content: function() {with(this.builder) {
    div().ref("body");
  }},

  viewProperties: {
    initialize: function() {
      this.body.html(this.comment.body());
    }
  }
});
