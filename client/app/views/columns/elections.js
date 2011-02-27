_.constructor("Views.Columns.Elections", View.Template, {
  content: function(params) { with(this.builder) {
    div({'class': "elections", style: "display: none;"}, function() {
      div({'class': "columnHeader"}, function() {
        h2("Questions");
      });

      subview('electionsList', Views.SortedList, {
        rootAttributes: {'class': "electionsList"},
        buildElement: function(election) {
          return Views.Columns.ElectionLi.toView({
            record: election,
            containingColumn: params.containingColumn
          });
        }
      });

      div({'class': "loading"}).ref("loading");
    }).ref("body");
  }},

  viewProperties: {
    
    relativeWidth: 1,

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    state: {
      afterChange: function(state) {
        this.startLoading();
        var electionRelation, relationsToFetch;
        if (state.parentRecordId) {
          electionRelation = Organization.where({id: state.parentRecordId}).joinThrough(Election);
        } else {
          electionRelation = Election.where({id: state.recordId});
        }
        relationsToFetch = [
          electionRelation,
          electionRelation.joinThrough(Candidate),
          electionRelation.joinThrough(ElectionComment),
          electionRelation.joinThrough(Vote),
          electionRelation.join(User).on(Election.creatorId.eq(User.id))
        ];
        Server.fetch(relationsToFetch).onSuccess(function() {
          this.electionsList.relation(electionRelation);
          this.stopLoading();
        }, this);
      }
    },

    startLoading: function() {
      this.electionsList.children().hide();
      this.loading.show();
    },

    stopLoading: function() {
      this.loading.hide();
      this.electionsList.children().show();
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1); // temporary fix
    }
  }
});
