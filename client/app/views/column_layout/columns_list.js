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
    numOnScreenColumns: 2,
    numOffScreenColumns: 2,

    initialize: function() {
      var width = 100.0 / (this.numOnScreenColumns - 1./2);
      this.offScreenColumns = [];
      for (var i = 0; i < this.numOnScreenColumns + this.numOffScreenColumns; i++) {
        this.offScreenColumns[i] = Views.ColumnLayout.ColumnLi.toView();
        this.offScreenColumns[i].hide();
        this.offScreenColumns[i].containingList = this;
        this.offScreenColumns[i].appendTo(this.list);
        this.offScreenColumns[i].css('width', width + "%");
        this.offScreenColumns[i].css('left', i * width + "%");
      }
      this.onScreenColumns = this.offScreenColumns.splice(0, this.numOnScreenColumns);
      this.renumberColumns();
      this.adjustScrollPosition();

      $(window).resize(this.hitch('adjustHeight'));
      this.defer(function() {
        this.hitch('adjustHeight');
        Application.onUserSwitch(function() {$(window).trigger('hashchange')});
      });
    },

    navigate: function(state) {
      var newColumnStates = this.getColumnStatesFromUrlState(state);
      this.shiftColumnsToMatch(newColumnStates);
      _(this.onScreenColumns).each(function(column, i) {column.state(newColumnStates[i])}, this);

      this.defer(this.hitch('adjustHeight'));
      Application.layout.activateNavigationTab("questionsLink");
    },

    getColumnStatesFromUrlState: function(state) {
      var columnStates = [];
      for (var i = 0; i < this.numOnScreenColumns; i++) {
        columnStates[i] = {
          parentTableName: state["col" + i],
          parentRecordId:  state["id" + i],
          tableName:       state["col" + (i+1)],
          recordId:        state["id" + (i+1)],
          childTableName:  state["col" + (i+2)],
          userId:          Application.currentUserId
        };
      }
      return columnStates;
    },

    shiftColumnsToMatch: function(newStates) {
      var state, numberShifted;
      _(this.onScreenColumns).any(function(column, i) {
        return _(newStates).any(function(newState, j) {
          state = column.state();
          if (state && (state.tableName === newState.tableName) &&
             (state.recordId === newState.recordId)) {
            numberShifted = i - j;
            return true;
          }
        });
      });
      if (numberShifted > 0) this.scrollRight(numberShifted);
      if (numberShifted < 0) this.scrollLeft(numberShifted * -1);
    },

    scrollRight: function(numberShifted) {
      _(numberShifted).times(function() {
        this.offScreenColumns.push(this.onScreenColumns.shift());
        this.onScreenColumns.push(this.offScreenColumns.shift());
        var n = this.onScreenColumns.length - 1;
        this.onScreenColumns[n].css({
          left: parseFloat(this.onScreenColumns[n-1].css('left')) +
                parseFloat(this.onScreenColumns[n-1].css('width')) + "%"
        });
      }, this);
      this.renumberColumns();

      setTimeout(this.bind(function() {
        this.defer(this.hitch('adjustScrollPosition', 150))
      }), 250);
    },

    scrollLeft: function(numberShifted) {
      _(numberShifted).times(function() {
        this.offScreenColumns.unshift(this.onScreenColumns.pop());
        this.onScreenColumns.unshift(this.offScreenColumns.pop());
        this.onScreenColumns[0].css({
          left: parseFloat(this.onScreenColumns[1].css('left')) -
                parseFloat(this.onScreenColumns[1].css('width')) + "%"
        });
      }, this);
      this.renumberColumns();

      setTimeout(this.bind(function() {
        this.list.children('.column').removeClass("first");
        this.onScreenColumns[0].addClass("first");
        this.defer(this.hitch('adjustScrollPosition', 150))
      }), 250);
    },

    adjustScrollPosition: function(duration) {
      if (! duration) duration = 0;
      var left = (-1.0 * parseFloat(this.onScreenColumns[0].css('left'))) -
                 (0.5  * parseFloat(this.onScreenColumns[0].css('width')));
      _(this.onScreenColumns).each(function(column) {column.show()});
      this.list.css({left: left + "%"});
      setTimeout(this.bind(function() {
        _(this.offScreenColumns).each(function(column) {column.hide()});
        this.list.children('.column').removeClass("first");
        this.onScreenColumns[0].addClass("first");
        this.adjustHeight();
      }), duration);

//      this.list.animate({left: left + "%"}, duration, this.bind(function() {
//        this.list.children('.column').removeClass("first");
//        this.onScreenColumns[0].addClass("first");
//        this.onScreenColumns[0].adjustHeight();
//        _(this.offScreenColumns).each(function(column) {column.hide()});
//      }));
    },

    renumberColumns: function() {
      _(this.onScreenColumns).each(function(column, i) {column.number = i});
      _(this.offScreenColumns).each(function(column) {column.number = null});
    },

    handleInvalidState: function(error) {
      console.debug("Invalid URL Hash:");
      console.debug(error);
    },

    adjustHeight: function() {
      this.list.fillContainingVerticalSpace();
      _(this.onScreenColumns).each(function(column) {column.adjustHeight()});
    }
  }
});
