_.constructor("Views.Columns.RecordsColumn", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "recordColumn", style: "display: none;"}, function() {
      div({'class': "columnHeader"}, "Records");

      subview('list', Views.SortedList, {
        buildElement: function(record) {
          return Views.Columns.RecordLi.toView({record: record});
        }
      });

      div({'class': "loading fetching", style: "display: none"}).ref('loading');
    });
  }},

  viewProperties: {
    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    state: {
      afterChange: function(state) {

        // decide what additional relations to fetch.

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
    },

    organizationId: function() {
      return 1;
    }
  }
});
