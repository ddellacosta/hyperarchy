_.constructor("Views.Tree.Column", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "column"}, function() {

    }).ref("columnDiv");
  }},

  viewProperties: {

    initialize: function() {
      this.views = {
//        organizations: Views.Tree.OrganizationsList.toView(),
//        elections:     Views.Tree.ElectionsList.toView(),
//        candidates:    Views.Tree.CandidatesList.toView(),
//        comments:      Views.Tree.CommentsList.toView(),
//        votes:         Views.Tree.VotesList.toView(),
        default:       Views.SortedList.toView({
          buildElement: function(record) {
            return $("<li>" + record.id() + " " + record.body() + "</li>");
          }
        })
      };

      _(this.views).each(function(view) {
        this.columnDiv.append(view);
      }, this);
    },

    state: {
      afterChange: function(state) {
        state.relation.fetch().onSuccess(function() {
          var view = this.views[state.tableName] || this.views.default;
          view.relation(state.relation);
          this.switchToView(view);
        }, this);
      }
    },

    switchToView: function(view) {
      _(this.views).each(function(view) {
        view.hide();
      });
      view.show();
    }
  }
});
