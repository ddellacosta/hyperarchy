//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

_.constructor('Views.Pages.Organization.QuestionLi', OldMonarch.View.Template, {
  content: function() { with(this.builder) {
    li({'class': "question"}, function() {
      div(function() {
        subview('avatar', Views.Components.Avatar, {imageSize: 50});
        div({'class': "body"}).ref('body')
        subview('answers', Views.Components.SortedList, {
          buildElement: function(answer, index) {
            return OldMonarch.View.build(function(b) { with(b) {
              li({'class': "answer"}, function() {
                div({'class': "position"}, answer.position()).ref('position');
                div({'class': "body"}, function() {
                  raw($.markdown(answer.body()));
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
      this.answers.relation(this.question.answers().limit(6));
      this.avatar.user(this.question.creator());
    }
  }
});
