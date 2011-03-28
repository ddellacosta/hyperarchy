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

    maxVisibleColumns:   2,
    minInvisibleColumns: 2,

    initialize: function() {
      this.visibleColumns = [];
      this.invisibleColumns = [];
      var totalNumColumns = this.maxVisibleColumns + this.minInvisibleColumns;
      for (var i = 0; i < totalNumColumns; i++) {
        this.invisibleColumns[i] = Views.ColumnLayout.ColumnLi.toView();
        this.invisibleColumns[i].containingList = this;
        this.invisibleColumns[i].appendTo(this.list);
      }
      this.arrangeColumns();
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
      this.arrangeColumns('fast');

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

    arrangeColumns: function(duration) {
      if (! duration) duration = 0;
      var width = 100.0 / (this.numVisibleColumns() - 1/2);
      var onComplete = this.bind(function() {
        _(this.invisibleColumns).each(function(column, i) {
          column.hide();
          column.removeClass("first");
        }, this);
        _(this.visibleColumns).each(function(column, i) {
          column[(i > 0) ? 'removeClass' : 'addClass']("first");
        }, this);
        this.adjustHeight();
      });

      // first invisible column is off-screen right. others are off-screen left.
      var furthestLeft = width * (1/2 - this.invisibleColumns.length);
      _(this.invisibleColumns).first().
        animate({
          width: width + "%",
          left: 100 + "%"
        }, duration, onComplete);
      _(this.invisibleColumns.slice(1)).each(function(column, i) {
        column.animate({
          width: width + "%",
          left: furthestLeft + (i * width) + "%"
        }, duration)
      });
      _(this.visibleColumns).each(function(column, i) {
        column.show();
        column.animate({
          width: width + '%',
          left: ((i - 1/2) * width)  + '%'
        }, duration)
      }, this);
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
        this.renumberColumns();
      }
    },

    statesAreScrolledLeft: function(columnStates) {
      return false;
    },

    statesAreScrolledRight: function(columnStates) {
      return false;
    },

    renumberColumns: function() {
      _(this.visibleColumns).each(function(column, i) {
        column.number = i;
      });
      _(this.invisibleColumns).each(function(column) {
        column.number = null;
      });
    },

    scrollLeft: function() {
      var newFirstColumn = this.invisibleColumns.pop();
      var oldLastColumn  = this.visibleColumns.pop();
      this.visibleColumns.unshift(newFirstColumn);
      this.invisibleColumns.unshift(oldLastColumn);

      this.renumberColumns();
      this.visibleColumns[0].addClass("first");
      this.visibleColumns[1].removeClass("first");
      this.arrangeColumns('fast');
    },

    scrollRight: function() {
      var newLastColumn  = this.invisibleColumns.shift();
      var oldFirstColumn = this.visibleColumns.shift();
      this.visibleColumns.push(newLastColumn);
      this.invisibleColumns.push(oldFirstColumn);

      this.renumberColumns();
      this.arrangeColumns('fast');
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

    columns: function() {
      return this.visibleColumns.concat(this.invisibleColumns);
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
