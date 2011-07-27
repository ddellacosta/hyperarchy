_.constructor('Views.Pages.Meeting.NoteLi', Monarch.View.Template, {
  content: function(params) { with(this.builder) {
    li({'class': "note"}, function() {
      subview('avatar', Views.Components.Avatar, {imageSize: params.fullScreen ? 46 : 34});
      a({'class': "destroy"}, "×").ref('destroyButton').click('destroy');
      div({'class': "date"}).ref('createdAt');
      div({'class': "text"}, function() {
        div({'class': "name"}).ref('creatorName');
        span({'class': "body"}).ref('body');
      });
    })
  }},

  viewProperties: {
    initialize: function() {
      this.avatar.user(this.note.creator());
      this.creatorName.bindText(this.note.creator(), 'fullName');
      this.body.markdown(this.note.body());
      this.createdAt.text(this.note.formattedCreatedAt());
      this.registerInterest(Application.signal('currentUser'), 'change', this.hitch('enableOrDisableDestruction'));
      this.enableOrDisableDestruction();
    },

    enableOrDisableDestruction: function() {
      if (this.note.editableByCurrentUser()) {
        this.addClass('destroyable');
      } else {
        this.removeClass('destroyable');
      }
    },

    destroy: function() {
      this.note.destroy();
    }
  }
});
