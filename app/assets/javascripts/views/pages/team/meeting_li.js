_.constructor('Views.Pages.Team.MeetingLi', Monarch.View.Template, {
  content: function() { with(this.builder) {
    li({'class': "meeting"}, function() {
      div(function() {
        subview('avatar', Views.Components.Avatar, {imageSize: 50});
        div({'class': "body"}).ref('body')
        subview('agendaItems', Views.Components.SortedList, {
          buildElement: function(agendaItem, index) {
            return Monarch.View.build(function(b) { with(b) {
              li({'class': "agenda-item"}, function() {
                div({'class': "position"}, agendaItem.position()).ref('position');
                div({'class': "body"}, function() {
                  raw($.markdown(agendaItem.body()));
                }).ref('body');
              });
            }});
          },
          onUpdate: function(li, record) {
            li.position.text(record.position());
            li.body.markdown(record.body());
          }
        });
        div({'class': "fadeout"});
      }).click(function() {
        History.pushState(null, null, this.meeting.url());
      });
    });
  }},

  viewProperties: {
    initialize: function() {
      this.body.bindMarkdown(this.meeting, 'body');
      this.agendaItems.relation(this.meeting.agendaItems().limit(6));
      this.avatar.user(this.meeting.creator());
    }
  }
});
