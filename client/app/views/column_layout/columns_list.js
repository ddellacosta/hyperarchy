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
      if (this.statesAreScrolledLeft(newColumnStates)) this.scrollLeft();
      else if (this.statesAreScrolledRight(newColumnStates)) this.scrollRight();

      this.numVisibleColumns(newColumnStates.length);
      _(this.visibleColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      this.adjustWidths();

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

    statesAreScrolledLeft: function(columnStates) {
      if (columnStates[1])
      return false;
    },

    statesAreScrolledRight: function(columnStates) {
      return false;
    },

    numVisibleColumns: {
      afterChange: function(numVisibleColumns) {
        if (numVisibleColumns < 1) this.handleInvalidState();
        var numColumnsToAdd = numVisibleColumns - this.visibleColumns.length;
        _(Math.abs(numColumnsToAdd)).times(function() {
          if (numColumnsToAdd > 0) {
            this.visibleColumns.push(this.invisibleColumns.shift());
            _(this.visibleColumns).last().appendTo(this.list);
          } else {
            _(this.visibleColumns).last().detach();
            this.invisibleColumns.unshift(this.visibleColumns.pop())
          }
        }, this);
        this.renumberColumns();
      }
    },

    renumberColumns: function() {
      _(this.visibleColumns).each(function(column, i) {
        column.number = i;
      });
      this.visibleColumns[0].addClass("first");
    },

    scrollLeft: function() {
      var newFirstColumn = this.invisibleColumns.pop();
      var oldLastColumn  = this.visibleColumns.pop();
      this.visibleColumns.unshift(newFirstColumn);
      this.invisibleColumns.unshift(oldLastColumn);
      this.renumberColumns();

      newFirstColumn.prependTo(this.list);
      this.adjustWidths();
      this.defer(function() {
        oldLastColumn.detach();
      });
    },

    scrollRight: function() {
      var newLastColumn  = this.invisibleColumns.shift();
      var oldFirstColumn = this.visibleColumns.shift();
      this.visibleColumns.push(newLastColumn);
      this.invisibleColumns.push(oldFirstColumn);
      this.renumberColumns();
      
      newLastColumn.appendTo(this.list);
      this.adjustWidths();
      this.defer(function() {
        oldFirstColumn.detach();
      });
    },

    setColumnState: function(column, columnState) {
      column.state(columnState);
      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    scrollLeftAndSetLeftColumnState: function(columnState) {
      var newFirstColumn = _(this.invisibleColumns).last();
      newFirstColumn.state(columnState);
      this.defer(function() {
        this.scrollLeft();
        $.bbq.pushState(this.getUrlStateFromColumnStates());
      });
    },

    scrollRightAndSetRightColumnState: function(columnState) {
      var newLastColumn = _(this.invisibleColumns).first();
      newLastColumn.state(columnState);
      this.defer(function() {
        this.scrollRight();
        $.bbq.pushState(this.getUrlStateFromColumnStates());
      });
    },

    handleInvalidState: function(error) {
      console.debug("Invalid URL Hash:");
      console.debug(error);
      // redirect to some default state
    },

    adjustWidths: function() {
      var widthFraction = 1 / (this.numVisibleColumns() - 1./2);
      var percentWidth = widthFraction * 100.0;
      var percentLeftPosition = -1/2 * percentWidth;
      _(this.visibleColumns).each(function(column, i) {
        column.css('width', percentWidth + '%');
        column.css('left',  percentLeftPosition  + '%');
        percentLeftPosition += percentWidth;
      });
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
