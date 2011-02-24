_.constructor("Views.Tree.RecordList", View.Template, {
  content: function() { with(this.builder) {
    div({style: "display: none;"}, function() {
      div({'class': "columnHeader"}, "Records");

      subview('list', Views.SortedList, {
        buildElement: function(record) {
          return Views.Tree.RecordLi.toView({record: record});
        }
      });

      div({'class': "loading fetching", style: "display: none"}).ref('loading');
    });
  }},

  viewProperties: {
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    relation: {
      afterChange: function(relation) {

        // decide what additional relations to fetch.

        relation.fetch().onSuccess(function() {
          this.list.relation(this.relation());
        }, this );
      }
    },

    recordId: {
      afterChange: function() {

      }
    },

    empty: function() {
      this.candidatesList.empty();
    },


    afterShow: function() {
      this.adjustHeight();
    },

    adjustHeight: function() {
      this.list.fillVerticalSpace(50, 200);
      this.loading.position({
        my: 'center center',
        at: 'center center',
        of: this.rankedCandidatesList
      });
    }
  }
});
