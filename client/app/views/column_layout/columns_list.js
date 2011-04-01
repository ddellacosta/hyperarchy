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
    numColumns: 4,
    maxOnScreenColumns: 2,

    initialize: function() {
      this.onScreenColumns       = [];
      this.offScreenLeftColumns  = [];
      this.offScreenRightColumns = [];
      for (var i = 0; i < this.numColumns - 1; i++) {
        this.offScreenLeftColumns[i] = Views.ColumnLayout.ColumnLi.toView();
      }
      this.offScreenRightColumns[0] = Views.ColumnLayout.ColumnLi.toView();
      _(this.offScreenColumns()).each(function(column) {
        column.containingList = this;
        column.appendTo(this.list);
      }, this);

      $(window).resize(this.hitch('adjustHeight'));
      this.defer(this.hitch('adjustHeight'));
    },

    navigate: function(state) {
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      var numberAdded   = this.setNumOnScreenColumns(newColumnStates.length);
      var numberShifted = this.shiftColumnsToMatch(newColumnStates);
      this.renumberColumns();
      _(this.onScreenColumns).each(function(column, i) {
        column.state(newColumnStates[i]);
      }, this);
      if (numberAdded || numberShifted) this.defer(
        this.hitch('arrangeColumns', numberAdded, numberShifted));

      Application.layout.activateNavigationTab("questionsLink");
    },

    // --- private ---

    getColumnStatesFromUrlState: function(state) {
      var states = [];
      for (var i = 0; i < this.maxOnScreenColumns; i++) {
        states[i] = {
          tableName:       state["col" + (i+1)] || undefined,
          parentTableName: state["col" + i]     || undefined,
          childTableName:  state["col" + (i+2)] || undefined,
          recordId:        parseInt(state["id" + (i+1)]) || undefined,
          parentRecordId:  parseInt(state["id" + i])     || undefined
        };
        if (! (states[i].tableName && (states[i].parentRecordId || states[i].recordId))) {
          states.pop();
          break;
        }
      }
      return states;
    },

    setNumOnScreenColumns: function(newNumber) {
      if (newNumber < 1) this.handleInvalidState();
      var numberAdded = newNumber - this.onScreenColumns.length;
      _(numberAdded).times(function() {
        this.onScreenColumns.unshift(this.offScreenLeftColumns.pop())
      }, this);
      _(numberAdded * -1).times(function() {
        this.offScreenLeftColumns.push(this.onScreenColumns.shift());
      }, this);
      return numberAdded;
    },

    shiftColumnsToMatch: function(newStates) {
      var state, doesMatch, numberShifted;
      _(this.onScreenColumns).any(function(column, i) {
        state = column.state();
        if (!state) return false;
        return _(newStates).any(function(newState, j) {
          doesMatch = newState.tableName === state.tableName && newState.recordId  === state.recordId;
          if (doesMatch) {
            numberShifted = i - j;
            return true;
          }
        });
      });

      this.shiftColumns(numberShifted);
      return numberShifted;
    },

    shiftColumns: function(numberShifted) {
      if (numberShifted > 0) {
        _(numberShifted).times(function() {
          this.offScreenLeftColumns.push(this.onScreenColumns.shift());
          this.onScreenColumns.push(this.offScreenRightColumns.shift());
          this.offScreenRightColumns.push(this.offScreenLeftColumns.shift());
        }, this);
      }
      if (numberShifted < 0) {
        _(numberShifted * -1).times(function() {
          this.offScreenRightColumns.unshift(this.onScreenColumns.pop());
          this.onScreenColumns.unshift(this.offScreenLeftColumns.pop());
          this.offScreenLeftColumns.unshift(this.offScreenRightColumns.pop());
        }, this);
      }
    },

    arrangeColumns: function(numberAdded, numberShifted) {
      var duration = 150;

      var width = 100.0 / (this.onScreenColumns.length - 1/2);
      var afterCallback = this.bind(function() {
        this.list.children('column').removeClass('first');
        this.onScreenColumns[0].addClass("first");
        _(this.offScreenColumns()).each(function(column) {
          column.hide();
        });
        this.adjustHeight();
      });

      if (numberAdded) {
        this.list.children('.column').css('width', width + "%");
        duration = 0;
      }
      if (numberShifted < 0) {
        this.onScreenColumns[0].show();
        this.onScreenColumns[0].addClass("first");
        this.onScreenColumns[1].removeClass("first");
        this.onScreenColumns[0].adjustHeight();
      }

      var n = this.offScreenLeftColumns.length;
      _(this.offScreenLeftColumns).each(function(column, i) {
        column.animate({left: ((-1/2 - n + i) * width) + "%"}, duration);
      }, this);
      _(this.offScreenRightColumns).each(function(column, i) {
        column.animate({left: 100 + (i * width) + "%"}, duration);
      }, this);
      _(this.onScreenColumns).each(function(column, i) {
        column.show();
        column.animate({left: ((i - 1/2) * width)  + '%'}, duration, (i == 0) ? afterCallback : null);
      }, this);
    },

    renumberColumns: function() {
      _(this.onScreenColumns).each(function(column, i) {column.number = i});
      _(this.offScreenColumns()).each(function(column) {column.number = null});
    },

    offScreenColumns: function() {
      return this.offScreenLeftColumns.concat(this.offScreenRightColumns);
    },

    handleInvalidState: function(error) {
      console.debug("Invalid URL Hash:");
      console.debug(error);
      // redirect to some default state
    },

    adjustHeight: function() {
      this.list.fillContainingVerticalSpace();
      _(this.onScreenColumns).each(function(column) {column.adjustHeight()});
    }
  }
});
