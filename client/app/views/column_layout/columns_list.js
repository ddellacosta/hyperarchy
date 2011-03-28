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

    maxOnScreenColumns:  3,
    minOffScreenColumns: 2,

    initialize: function() {
      this.onScreenColumns = [];
      this.offScreenLeftColumns = [];
      this.offScreenRightColumns = [];
      this.numColumns = this.maxOnScreenColumns + this.minOffScreenColumns;
      for (var i = 0; i < this.numColumns; i++) {
        this.offScreenLeftColumns[i] = Views.ColumnLayout.ColumnLi.toView();
        this.offScreenLeftColumns[i].containingList = this;
        this.offScreenLeftColumns[i].appendTo(this.list);
      }
      $(window).resize(this.hitch('adjustHeight'));
    },

    navigate: function(state) {
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      this.numOnScreenColumns(newColumnStates.length);
      // to do: scroll left or right based on newColumnStates
      _(this.onScreenColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      this.arrangeColumns();

      Application.layout.activateNavigationTab("questionsLink");
    },

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      var tableName, parentTableName, childTableName, recordId, parentRecordId;
      for (var i = 0; i < this.maxOnScreenColumns; i++) {
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
      _(this.onScreenColumns).each(function(column, i) {
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
      this.arrangeOffScreenColumns(duration);
      this.arrangeOnScreenColumns(duration);
    },

    arrangeOnScreenColumns: function(duration) {
      if (! duration) duration = 0;
      var width = 100.0 / (this.numOnScreenColumns() - 1/2);
      _(this.onScreenColumns).each(function(column, i) {
        column.show();
        column.animate({
          width: width + '%',
          left: ((i - 1/2) * width)  + '%'
        }, duration, function() {
          column[(i > 0) ? 'removeClass' : 'addClass']("first");
          column.adjustHeight();
        });
      }, this);
    },

    arrangeOffScreenColumns: function(duration) {
      if (! duration) duration = 0;
      var width = 100.0 / (this.numOnScreenColumns() - 1/2);
      var furthestLeft = width * (-1/2 - this.offScreenLeftColumns.length);
      _(this.offScreenRightColumns).each(function(column, i) {
        column.animate({
          width: width + "%",
          left: 100 + (i * width) + "%"
        }, duration, function() {
          column.hide();
          column.removeClass("first");
        });
      }, this);
      _(this.offScreenLeftColumns).each(function(column, i) {
        column.animate({
          width: width + "%",
          left: furthestLeft + (i * width) + "%"
        }, duration, function() {
          column.hide();
          column.removeClass("first");
        });
      }, this);
    },

    scrollLeft: function() {
      if (this.offScreenLeftColumns.length === 0) {
        this.offScreenLeftColumns.unshift(this.offScreenRightColumns.pop());
        this.arrangeOffScreenColumns();
      }

      this.onScreenColumns.unshift(this.offScreenLeftColumns.pop());
      this.offScreenRightColumns.unshift(this.onScreenColumns.pop());
      this.renumberColumns();
      this.onScreenColumns[0].addClass("first");
      this.onScreenColumns[1].removeClass("first");
      this.arrangeColumns('fast');
    },

    scrollRight: function() {
      if (this.offScreenRightColumns.length === 0) {
        this.offScreenRightColumns.push(this.offScreenLeftColumns.shift());
        this.arrangeOffScreenColumns();
      }

      this.onScreenColumns.push(this.offScreenRightColumns.shift());
      this.offScreenLeftColumns.push(this.onScreenColumns.shift());
      this.renumberColumns();
      this.arrangeColumns('fast');
    },

    numOnScreenColumns: {
      afterChange: function(numOnScreenColumns) {
        if (numOnScreenColumns < 1) this.handleInvalidState();
        var numColumnsToAdd = numOnScreenColumns - this.onScreenColumns.length;
        if (numColumnsToAdd > 0) {
          _(numColumnsToAdd).times(function() {
            var newOnScreenColumn = this.offScreenRightColumns.shift() || this.offScreenLeftColumns.shift();
            this.onScreenColumns.push(newOnScreenColumn);
          }, this);
        } else {
          _(numColumnsToAdd * -1).times(function() {
            this.offScreenRightColumns.unshift(this.onScreenColumns.pop());
          }, this)
        }
        this.renumberColumns();
      }
    },

    offScreenColumns: function() {
      return this.offScreenLeftColumns.concat(this.offScreenRightColumns);
    },

    renumberColumns: function() {
      _(this.onScreenColumns).each(function(column, i) {
        column.number = i;
      });
      _(this.offScreenLeftColumns).each(function(column) {
        column.number = null;
      });
    },

    setColumnState: function(column, columnState) {
      column.state(columnState);
      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    scrollLeftAndSetLeftColumnState: function(columnState) {
      var newFirstColumn = _(this.offScreenLeftColumns).last();
      newFirstColumn.state(columnState);
      this.scrollLeft();
//      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    scrollRightAndSetRightColumnState: function(columnState) {
      var newLastColumn = _(this.offScreenLeftColumns).first();
      newLastColumn.state(columnState);
      this.scrollRight();
//      $.bbq.pushState(this.getUrlStateFromColumnStates());
    },

    columns: function() {
      return this.onScreenColumns.concat(this.offScreenLeftColumns);
    },

    handleInvalidState: function(error) {
      console.debug("Invalid URL Hash:");
      console.debug(error);
      // redirect to some default state
    },

    adjustHeight: function() {
      this.list.fillContainingVerticalSpace();
      _(this.onScreenColumns).each(function(column) {
        column.adjustHeight();
      });
    },

    afterShow: function() {
      this.defer(this.hitch('adjustHeight'));
    }
  }
});
