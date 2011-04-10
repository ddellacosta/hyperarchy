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

      this.views.votes = this.views.candidates;
    },

    // The column's state is represented by an object with the following properties:
    //   - tableName
    //   - recordId
    //   - parentTableName
    //   - parentRecordId
    //   - childTableName
    //   - userId.
    state: {
      afterChange: function(state, oldState) {
        if (! state || _(state).isEqual(oldState)) return;
        if (oldState
            && state.tableName === oldState.tableName
            && state.recordId  === oldState.recordId) {
          if (! state.parentTableName) state.parentTableName = oldState.parentTableName;
          if (! state.parentRecordId)  state.parentRecordId  = oldState.parentRecordId;
        }

        this.switchToView(state.tableName);
        this.currentView.state(state);
      }
    },

    // This method takes a column state object as a parameter, and alters the parts
    //  of the URL that correspond to THOSE properties of THIS column.
    //  If properties are omitted, the corresponding parts of the URL will be
    //  left unchanged. Properties with "falsey" values will cause the
    //  corresponding parts of the URL to be deleted.
    pushState: function(columnState) {
      var urlState = $.bbq.getState();
      if ('tableName' in columnState) {
        if (columnState.tableName) urlState["col" + (this.number+1)] = columnState.tableName;
        else delete urlState["col" + (this.number + 1)];
      }
      if ('recordId' in columnState) {
        if (columnState.recordId) urlState["id" + (this.number+1)] = columnState.recordId;
        else delete urlState["id" + (this.number + 1)];
      }
      if ('parentTableName' in columnState) {
        if (columnState.parentTableName) urlState["col" + this.number] = columnState.parentTableName;
        else delete urlState["col" + (this.number)];
      }
      if ('parentRecordId' in columnState) {
        if (columnState.parentRecordId) urlState["id" + this.number] = columnState.parentRecordId;
        else delete urlState["id" + (this.number)];
      }
      if ('childTableName' in columnState) {
        if (columnState.childTableName) urlState["col" + (this.number+2)] = columnState.childTableName;
        else delete urlState["col" + (this.number + 2)];
      }
      $.bbq.pushState(urlState, 2);
    },

    pushNextState: function(columnState) {
      if (this.nextColumn()) {
        this.nextColumn().pushState(columnState);
        return;
      }

      // adjust the url to cause a scroll to the right.
      var urlState = {}, currentState = $.bbq.getState();
      var n = this.containingList.onScreenColumns.length;
      for (var i = 1; i < n; i++) {
        urlState["col" + i] = currentState["col" + (i+1)];
        urlState["id" + i]  = currentState["id" + (i+1)];
      }

      if (columnState.tableName) urlState["col" + n] = columnState.tableName;
      if (columnState.recordId)  urlState["id"  + n] = columnState.recordId;
      if (columnState.parentTableName) urlState["col" + (n-1)] = columnState.parentTableName;
      if (columnState.parentRecordId)  urlState["id"  + (n-1)] = columnState.parentRecordId;
      $.bbq.pushState(urlState, 2);
    },

    adjustHeight: function() {if (this.currentView) this.currentView.adjustHeight()},

    // private

    switchToView: function(viewName) {
      this.currentView = this.views[viewName];
      if (! this.currentView) return this.handleInvalidState(this.state());
      this.children().hide();
      this.currentView.show();
    },

    nextColumn:     function() {return this.containingList.onScreenColumns[this.number + 1]},
    previousColumn: function() {return this.containingList.onScreenColumns[this.number - 1]},

    handleInvalidState: function(error) {this.containingList.handleInvalidState(error)},

    afterShow: function() {this.adjustHeight()}
  }
});
