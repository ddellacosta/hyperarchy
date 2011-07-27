_.constructor('Views.Pages.Organization.QuestionLi', Monarch.View.Template, {
  content: function() { with(this.builder) {
    li({'class': "question"}, function() {
      div(function() {
        subview('avatar', Views.Components.Avatar, {imageSize: 50});
        div({'class': "body"}).ref('body')
        subview('agendaItems', Views.Components.SortedList, {
          buildElement: function(agendaItem, index) {
            return Monarch.View.build(function(b) { with(b) {
              li({'class': "agendaItem"}, function() {
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
        History.pushState(null, null, this.question.url());
      });
    });
  }},

  viewProperties: {
    initialize: function() {
      this.body.bindMarkdown(this.question, 'body');
      this.agendaItems.relation(this.question.agendaItems().limit(6));
      this.avatar.user(this.question.creator());
    }
  }
});
