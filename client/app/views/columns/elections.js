_.constructor("Views.Columns.Elections", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "elections", style: "display: none;"}, function() {

      div({'class': "columnHeader"}, function() {
        h2("Questions");
      });

      div({'class': "columnBody"}, function() {
        subview('electionsList', Views.SortedList, {
          rootAttributes: {'class': "electionsList"},
          buildElement: function(election) {
            return Views.Columns.ElectionLi.toView({record: election});
          }
        });

        div({'class': "loading fetching"}).ref("loading");
      }).ref("body");

    });
  }},

  viewProperties: {
    
    relativeWidth: 1,

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;

      this.electionsList.buildElement = this.bind(function(election) {
        return Views.Columns.ElectionLi.toView({
          record: election,
          containingView: this
        });
      });
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
            electionRelation = Election.where({organizationId: state.parentRecordId});
          } else {
            electionRelation = Election.where({id: state.recordId});
          }
          var relationsToFetch = [
            electionRelation,
            electionRelation.join(User).on(Election.creatorId.eq(User.id))
          ];
          Server.fetch(relationsToFetch).onSuccess(function() {
            if (this.containingColumn.isFirst()) this.setCurrentOrganizationId(electionRelation);
            this.electionsList.relation(electionRelation);
            this.stopLoading();
          }, this);
        } catch (badCombinationOfTableNamesAndIds) {
          this.containingColumn.handleInvalidColumnState();
        }
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

    setCurrentOrganizationId: function(electionRelation) {
      var id = electionRelation.first().organizationId();
      Application.currentOrganizationId(id);
    }
  }
});
