_.constructor("Views.Columns.RankedCandidatesList", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "rankedCandidatesLists"}, function() {
      ol({'class': "columnList"}, function() {
        div({'class': "dragTargetExplanation"}, function() {
          raw("Drag answers you <em>like</em> here, <br /> with the best at the top.")
        }).ref('goodCandidatesExplanation');
      }).ref("goodCandidatesList");

      div({'class': "separator"}, function() {
        div({'class': "up"}, "good ideas");
        div({'class': "down"}, "bad ideas");
      }).ref('separator');

      ol({'class': "columnList"}, function() {
        div({'class': "dragTargetExplanation"}, function() {
          raw("Drag answers you <em>dislike</em> here, <br /> with the worst at the bottom.")
        }).ref('badCandidatesExplanation');
      }).ref('badCandidatesList');
    }).ref('rankedCandidatesList');
  }},

  viewProperties: {
    propertyAccessors: ["election"],

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle();
//      this.goodCandidatesList.sortable({
//        tolerance: "pointer",
//        update: this.hitch('handleUpdate'),
//        receive: this.hitch('handleReceive'),
//        sort: this.hitch('handleSort')
//      });
    }

  }
});