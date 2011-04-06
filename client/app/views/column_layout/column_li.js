_.constructor("Views.ColumnLayout.ColumnLi", View.Template, {
  content: function() {
    this.builder.tag("li", {'class': "column"});
  },

  viewProperties: {

    initialize: function() {
      this.views = {
        organizations: Views.ColumnLayout.OrganizationsView.toView(),
        elections:     Views.ColumnLayout.ElectionsView.toView(),
        candidates:    Views.ColumnLayout.CandidatesView.toView(),
        comments:      Views.ColumnLayout.CommentsView.toView()
      };
      _(this.views).each(function(view) {
        view.containingColumn = this;
        this.append(view.hide());
      }, this);
    },

    state: {
      afterChange: function(state, oldState) {
        if (! state || _(state).isEqual(oldState)) return;
        _(state).defaults(oldState);

        this.currentView = this.views[state.tableName];
        if (! this.currentView) return this.handleInvalidState(this.state())
        this.children().hide();
        this.currentView.show();
        this.currentView.state(state);
      }
    },

    pushState: function(state) {
      var urlState = {};
      urlState["col" + (this.number + 1)] = state.tableName;
      urlState["id"  + (this.number + 1)] = state.recordId;
      urlState["col" + (this.number)] = state.parentTableName;
      urlState["id"  + (this.number)] = state.parentRecordId;
      $.bbq.pushState(urlState);
    },

    pushNextState: function(state) {
      if (this.nextColumn()) {
        this.nextColumn().pushState(state);
        return;
      }
      var urlState = {}, currentState = $.bbq.getState();
      var n = this.containingList.onScreenColumns.length;
      for (var i = 1; i < n; i++) {
        urlState["col" + i] = currentState["col" + (i+1)];
        urlState["id" + i]  = currentState["id" + (i+1)];
      }
      if (state.tableName) urlState["col" + n] = state.tableName;
      if (state.recordId)  urlState["id"  + n] = state.recordId;
      if (state.parentTableName) urlState["col" + (n-1)] = state.parentTableName;
      if (state.parentRecordId)  urlState["id"  + (n-1)] = state.parentRecordId;
      $.bbq.pushState(urlState, 2);
    },

    pushPreviousState: function(state) {
      if (this.previousColumn()) {
        this.previousColumn().pushState(state);
        return;
      }
      var urlState = {}, currentState = $.bbq.getState();
      var n = this.containingList.onScreenColumns.length;
      for (var i = n; i > 1; i--) {
        urlState["col" + i] = currentState["col" + (i-1)];
        urlState["id" + i]  = currentState["id" + (i-1)];
      }
      if (state.tableName) urlState["col" + 1] = state.tableName;
      if (state.recordId)  urlState["col" + 1] = state.recordId;
      $.bbq.pushState(urlState, 2);
    },

    nextColumn:     function() {return this.containingList.onScreenColumns[this.number + 1]},
    previousColumn: function() {return this.containingList.onScreenColumns[this.number - 1]},
    handleInvalidState: function(error) {this.containingList.handleInvalidState(error)},

    adjustHeight:   function() {
//      console.debug(this.number);
      if (this.currentView) this.currentView.adjustHeight();
    },

    afterShow: function() {this.adjustHeight()}
  }
});
