_.constructor("Views.Columns.ColumnsList", View.Template, {
  content: function() {
    this.builder.tag("ol", {id: "columns"});
  },

  viewProperties: {
    viewName:    'columns',
    defaultView:  true,

    MAX_VISIBLE_COLUMNS:   3,
    MIN_INVISIBLE_COLUMNS: 2,

    initialize: function() {
      this.visibleColumns   = [];
      this.invisibleColumns = [];
      var totalColumns = this.MAX_VISIBLE_COLUMNS + this.MIN_INVISIBLE_COLUMNS;
      for (var i = 0; i < totalColumns; i++) {
        this.invisibleColumns[i] = Views.Columns.ColumnLi.toView();
        this.invisibleColumns[i].containingList = this;
      }

      $(window).resize(this.hitch('adjustWidth'));
    },

    navigate: function(state) {
      if (this.nextStateIsAlreadySetUp) {
        this.nextStateIsAlreadySetUp = false;
        return;
      }
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      this.numVisibleColumns(newColumnStates.length);
      _(this.visibleColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      this.formatColumns();
      this.defer(this.hitch('adjustHeight'));

      Application.layout.activateNavigationTab("questionsLink");
    },

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      var recordId, tableName, parentRecordId, parentTableName;
      for (var i = 0; i < this.MAX_VISIBLE_COLUMNS; i++) {
        tableName       = state["col" + (i+1)];
        parentTableName = state["col" + i];
        recordId        = parseInt(state["id" + (i+1)]);
        parentRecordId  = parseInt(state["id" + i]);
        if (! tableName) break;
        if (!recordId && !(parentTableName && parentRecordId)) break;
        columnStates[i] = {
          tableName:       tableName,
          parentTableName: parentTableName,
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

    scrollLeft: function() {
      var newFirstColumn = this.invisibleColumns.pop();
      var oldLastColumn  = this.visibleColumns.pop();
      this.visibleColumns.unshift(newFirstColumn);
      this.invisibleColumns.unshift(oldLastColumn);
      this.renumberColumns();

      newFirstColumn.prependTo(this);
      this.formatColumns();
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
      
      newLastColumn.appendTo(this);
      this.formatColumns();
      this.defer(function() {
        oldFirstColumn.detach();
      });
    },

    setColumnState: function(column, columnState) {
      column.state(columnState);
      this.nextStateIsAlreadySetUp = true;
      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    scrollLeftAndSetLeftColumnState: function(columnState) {
      var newFirstColumn = _(this.invisibleColumns).last();
      newFirstColumn.state(columnState);
      this.defer(function() {
        this.scrollLeft();
        this.nextStateIsAlreadySetUp = true;
        $.bbq.pushState(this.getUrlStateFromColumnStates());
      });
    },

    scrollRightAndSetRightColumnState: function(columnState) {
      var newLastColumn = _(this.invisibleColumns).first();
      newLastColumn.state(columnState);
      this.defer(function() {
        this.scrollRight();
        this.nextStateIsAlreadySetUp = true;
        $.bbq.pushState(this.getUrlStateFromColumnStates());
      });
    },

    formatColumns: function() {
      this.adjustWidth();
      _(this.visibleColumns).first().addClass("first");
      _(this.visibleColumns).last().addClass("last");
    },

    numVisibleColumns: {
      afterChange: function(numVisibleColumns) {
        if (numVisibleColumns < 1) this.handleInvalidState();
        var numColumnsToAdd = numVisibleColumns - this.visibleColumns.length;
        _(Math.abs(numColumnsToAdd)).times(function() {
          if (numColumnsToAdd > 0) {
            this.visibleColumns.push(this.invisibleColumns.shift());
            _(this.visibleColumns).last().appendTo(this);
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
        column.columnNumber(i);
      });
    },

    handleInvalidState: function(invalidState) {
      console.debug("invalid url hash");
      console.debug(invalidState);
      // redirect to some default state
    },

    adjustWidth: function() {
      var relativeWidths = [], totalRelativeWidth = 0;
      _(this.visibleColumns).each(function(column, i) {
        relativeWidths[i] = column.currentView.relativeWidth;
        totalRelativeWidth = totalRelativeWidth + relativeWidths[i];
      });
      var marginWidth  = (this.numVisibleColumns() - 1) * 10; // hard-coded to match css
      var paddingWidth = (this.numVisibleColumns() * 2) * 20; // hard-coded to match css
      var availableWidth = this.width() - marginWidth - paddingWidth;
      _(this.visibleColumns).each(function(column, i) {
        column.css('width', (relativeWidths[i] / totalRelativeWidth * availableWidth) - 5);
      });
    },

    adjustHeight: function(minHeight) {
      _(this.visibleColumns).each(function(column) {
        column.fillVerticalSpace();
        column.currentView.adjustHeight(minHeight);
      });
    }
  }
});
