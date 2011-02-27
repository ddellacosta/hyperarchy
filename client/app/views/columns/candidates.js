_.constructor("Views.Columns.Candidates", View.Template, {
  content: function(params) { with(this.builder) {
    div({'class': "candidates", style: "display: none;"}, function() {
      div({'class': "columnHeader"}, function() {
        h2("Answers");
      });

      subview('candidatesList', Views.SortedList, {
        rootAttributes: {'class': "candidatesList"},
        buildElement: function(candidate) {
          return Views.Columns.CandidateLi.toView({
            record: candidate,
            containingColumn: params.containingColumn
          });
        }
      });

      subview('rankedCandidatesList', Views.Columns.RankedCandidatesList);

      div({'class': "loading"}).ref("loading");
    }).ref("body");
  }},

  viewProperties: {

    relativeWidth: 2,

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    state: {
      afterChange: function(state) {
        this.startLoading();
        var candidateRelation, relationsToFetch;
        if (state.parentRecordId) {
          candidateRelation = Election.where({id: state.parentRecordId}).joinThrough(Candidate);
        } else {
          candidateRelation = Candidate.where({id: state.recordId});
        }
        relationsToFetch = [
          candidateRelation,
          candidateRelation.joinThrough(Election),
          candidateRelation.joinThrough(Ranking),
          candidateRelation.join(User).on(Candidate.creatorId.eq(User.id))
        ];
        Server.fetch(relationsToFetch).onSuccess(function() {
          this.candidatesList.relation(candidateRelation);
          this.stopLoading();
        }, this);
      }
    },

    afterShow: function() {
      this.adjustHeight();
    },

    adjustHeight: function() {
      this.loading.position({
        my: 'center center',
        at: 'center center',
        of: this.body
      });
      this.rankedCandidatesList.adjustHeight();
    },

    startLoading: function() {
      this.candidatesList.children().hide();
      this.rankedCandidatesList.children().hide();
      this.loading.show();
    },

    stopLoading: function() {
      this.loading.hide();
      this.candidatesList.children().show();
      this.rankedCandidatesList.children().show();
      this.adjustHeight();
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    }
  }
});
