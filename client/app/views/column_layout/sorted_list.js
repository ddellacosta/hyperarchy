_.constructor("Views.ColumnLayout.SortedList", Views.SortedList, {

  viewProperties: {

    initialize: function($super) {
      $super();
    },

    startLoading: function() {
      this.children().hide();
    },

    stopLoading: function() {
      this.children().show();
    }
  }
});