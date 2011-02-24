_.constructor("Views.Tree.Column", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "column"}, function() {

    }).ref("body");
  }},

  viewProperties: {

    initialize: function() {
      this.views = {
//        organizations: Views.Tree.OrganizationsList.toView(),
//        elections:     Views.Tree.ElectionsList.toView(),
//        candidates:    Views.Tree.CandidatesList.toView(),
//        comments:      Views.Tree.CommentsList.toView(),
//        votes:         Views.Tree.VotesList.toView(),
        default:       Views.Tree.RecordList.toView()
      };
      _(this.views).each(function(view) {
        view.hide();
        this.body.append(view);
      }, this);
    },

    state: {
      afterChange: function(state) {
        var view = this.views[state.tableName] || this.views.default; // temporary default
        this.currentView(view);
        view.relation(state.relation);
        view.recordId(state.recordId)
      }
    },

    currentView: {
      afterChange: function(currentView) {
        _(this.views).each(function(view) {
          view.hide();
        });
        currentView.show();
      }
    }
  }
});
