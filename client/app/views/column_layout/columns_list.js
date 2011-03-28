_.constructor("Views.ColumnLayout.ColumnsList", View.Template, {
  content: function() {with(this.builder) {
    div({'id': "columns"}, function() {
      div({'class': "subnav"});
      ol().ref("list");
    });
  }},

  viewProperties: {
    viewName:    'columns',
    defaultView:  true,

    maxVisibleColumns:   3,
    minInvisibleColumns: 2,

    initialize: function() {
      this.visibleColumns   = [];
      this.invisibleColumns = [];
      var totalNumColumns = this.maxVisibleColumns + this.minInvisibleColumns;
      for (var i = 0; i < totalNumColumns; i++) {
        this.invisibleColumns[i] = Views.ColumnLayout.ColumnLi.toView();
        this.invisibleColumns[i].containingList = this;
      }
      $(window).resize(this.hitch('adjustHeight'));
    },

    navigate: function(state) {
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      this.numVisibleColumns(newColumnStates.length);
      if (this.statesAreScrolledLeft(newColumnStates))  this.scrollLeft();
      if (this.statesAreScrolledRight(newColumnStates)) this.scrollRight();
      _(this.visibleColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      this.arrangeColumns();

      Application.layout.activateNavigationTab("questionsLink");
    },

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      var tableName, parentTableName, childTableName, recordId, parentRecordId;
      for (var i = 0; i < this.maxVisibleColumns; i++) {
        parentTableName = state["col" + i];
        tableName       = state["col" + (i+1)];
        childTableName  = state["col" + (i+2)];
        parentRecordId  = parseInt(state["id" + i]);
        recordId        = parseInt(state["id" + (i+1)]);
        if (! tableName) break;
        if (!recordId && !(parentTableName && parentRecordId)) break;
        columnStates[i] = {
          tableName:       tableName,
          parentTableName: parentTableName,
          childTableName:  childTableName,
          recordId:        recordId,
          parentRecordId:  parentRecordId
        };
      }
      return columnStates;
    },

    getUrlStateFromColumnStates: function() {
      var urlState = {};
      _(this.visibleColumns).each(function(column, i) {
        var state = column.state();
        if (state.tableName) urlState["col" + (i+1)] = state.tableName;
        if (state.recordId)  urlState["id" + (i+1)]  = state.recordId;
        if (i > 0) {
          if (state.parentTableName) urlState["col" + i] = state.parentTableName;
          if (state.parentRecordId)  urlState["id" + i]  = state.parentRecordId;
        }
      });
      return urlState;
    },

    numVisibleColumns: {
      afterChange: function(numVisibleColumns) {
        if (numVisibleColumns < 1) this.handleInvalidState();
        var numColumnsToAdd = numVisibleColumns - this.visibleColumns.length;
        _(Math.abs(numColumnsToAdd)).times(function() {
          if (numColumnsToAdd > 0) {
            this.visibleColumns.push(this.invisibleColumns.shift());
          } else {
            this.invisibleColumns.unshift(this.visibleColumns.pop())
          }
        }, this);
      }
    },

    statesAreScrolledLeft: function(columnStates) {
      return false;
    },

    statesAreScrolledRight: function(columnStates) {
      return false;
    },

    arrangeColumns: function(animate, complete) {
      var width = 100.0 / (this.numVisibleColumns() - 1/2);
      var leftPositions = _(this.visibleColumns).map(function(col, i) {return width * (i - 1/2)});
      var styleMethod = animate ? 'animate' : 'css';
      var duration = 'fast';

      _(this.visibleColumns).each(function(column, i) {
        if (! column.number) column.appendTo(this.list);
        column.currentView.adjustHeight();
        column.show();
        column[styleMethod]({
          width: width + '%',
          left: leftPositions[i]  + '%'
        }, duration);
      }, this);

      _(this.invisibleColumns).first()[styleMethod]({
        width: width + "%",
        left: 100 + "%"
      }, duration);
      _(this.invisibleColumns).last()[styleMethod]({
        width: width + "%",
        left: (-3/2 * width) + "%" 
      }, duration, complete);
      if (! animate) this.renumberColumns();
    },

    renumberColumns: function() {
      _(this.visibleColumns).each(function(column, i) {
        column.number = i;
        column.removeClass("first");
      });
      _(this.invisibleColumns).each(function(column) {
        column.removeClass("first");
        column.number = null;
//        column.hide();
        column.detach();
      });
      this.visibleColumns[0].addClass("first");
      this.adjustHeight();
    },

    scrollLeft: function() {
      var newFirstColumn = this.invisibleColumns.pop();
      var oldLastColumn  = this.visibleColumns.pop();
      this.visibleColumns.unshift(newFirstColumn);
      this.invisibleColumns.unshift(oldLastColumn);
      this.renumberColumns();
      this.adjustHeight();
      this.defer(this.hitch('arrangeColumns', true));
    },

    scrollRight: function() {
      var newLastColumn  = this.invisibleColumns.shift();
      var oldFirstColumn = this.visibleColumns.shift();
      this.visibleColumns.push(newLastColumn);
      this.invisibleColumns.push(oldFirstColumn);
      var completeCallback = this.hitch('renumberColumns');
      this.arrangeColumns(true, completeCallback);
    },

    setColumnState: function(column, columnState) {
      column.state(columnState);
      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    scrollLeftAndSetLeftColumnState: function(columnState) {
      var newFirstColumn = _(this.invisibleColumns).last();
      newFirstColumn.state(columnState);
      this.scrollLeft();
//      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    scrollRightAndSetRightColumnState: function(columnState) {
      var newLastColumn = _(this.invisibleColumns).first();
      newLastColumn.state(columnState);
      this.scrollRight();
//      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    handleInvalidState: function(error) {
      console.debug("Invalid URL Hash:");
      console.debug(error);
      // redirect to some default state
    },

    adjustHeight: function() {
      this.list.fillContainingVerticalSpace();
      _(this.visibleColumns).each(function(column) {
        column.currentView.adjustHeight();
      });
    },

    afterShow: function() {
      this.defer(this.hitch('adjustHeight'));
    }
  }
});
