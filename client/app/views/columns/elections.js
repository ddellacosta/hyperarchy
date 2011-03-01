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

      div({'class': "loading fetching"}).ref("loading");
    }).ref("body");
  }},

  viewProperties: {
    
    relativeWidth: 1,

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    state: {
      afterChange: function(state, oldState) {
        this.selectedRecordId(state.recordId);
        if (oldState &&
           (state.parentRecordId  === oldState.parentRecordId) &&
           (state.parentTableName === oldState.parentTableName)) return;

        this.startLoading();
        try {
          var electionRelation;
          if (state.parentRecordId) {
            electionRelation = Organization.where({id: state.parentRecordId}).joinThrough(Election);
          } else {
            electionRelation = Election.where({id: state.recordId});
          }
          var relationsToFetch = [
            electionRelation,
            electionRelation.joinThrough(Candidate),
            electionRelation.joinThrough(ElectionComment),
            electionRelation.joinThrough(Vote),
            electionRelation.join(User).on(Election.creatorId.eq(User.id))
          ];
        } catch (relation) {
          this.containingColumn.handleInvalidColumnState();
        }
        Server.fetch(relationsToFetch).onSuccess(function() {
          this.electionsList.relation(electionRelation);
          if (this.containingColumn.columnNumber() == 0) this.setCurrentOrganizationId();
          this.stopLoading();
        }, this);
      }
    },

    selectedRecordId: {
      afterChange: function(id) {

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
//      var id = this.relation().first().organizationId();
//      Application.currentOrganizationId(id);
      Application.currentOrganizationId(1);
    }
  }
});
