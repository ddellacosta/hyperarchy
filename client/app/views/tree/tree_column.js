_.constructor("Views.Tree.Column", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "column"}, function() {

    });
  }},

  viewProperties: {

    initialize: function() {
      this.views = {
//        organizations: Views.Tree.OrganizationsList.toView(),
//        elections:     Views.Tree.ElectionsList.toView(),
//        candidates:    Views.Tree.CandidatesList.toView(),
//        comments:      Views.Tree.CommentsList.toView(),
//        votes:         Views.Tree.VotesList.toView()
      };
    },

    state: {
      afterChange: function(state) {
        this.startLoading();
        this.views[state.tableName].relation(state.relation);
        this.switchToView(state.tableName);
      }
    },

    startLoading: function() {

    },

    switchToView: function(viewName) {

    }
  }
});
