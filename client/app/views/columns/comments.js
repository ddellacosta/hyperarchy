_.constructor("Views.Columns.Comments", View.Template, {
  content: function(params) { with(this.builder) {
    div({'class': "comments", style: "display: none;"}, function() {
      div({'class': "columnHeader"}, function() {
        h2("Comments");
      });

      subview('commentsList', Views.SortedList, {
        rootAttributes: {'class': "commentsList"},
        buildElement: function(comment) {
          return Views.Columns.CommentLi.toView({
            record: comment,
            containingColumn: params.containingColumn
          });
        }
      });

      div({'class': "loading"}).ref("loading");
    });
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
          var commentRelation, parentConstructor, commentConstructor;
          if (state.parentTableName === "elections")  {
            parentConstructor  = Election;
            commentConstructor = ElectionComment;
          }
          if (state.parentTableName === "candidates")  {
            parentConstructor  = Candidate;
            commentConstructor = CandidateComment;
          }
          commentRelation = parentConstructor.where({id: state.parentRecordId}).
                              joinThrough(commentConstructor);
          var relationsToFetch = [
            commentRelation,
            commentRelation.join(User).on(commentConstructor.creatorId.eq(User.id))
          ];
        } catch (error) {
          this.containingColumn.handleInvalidColumnState();
        }
        Server.fetch(relationsToFetch).onSuccess(function() {
          this.commentsList.relation(commentRelation);
          this.stopLoading();
        }, this);
      }
    },

    selectedRecordId: {
      afterChange: function(id) {

      }
    },

    startLoading: function() {
      this.commentsList.children().hide();
      this.loading.show();
    },

    stopLoading: function() {
      this.loading.hide();
      this.commentsList.children().show();
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    }
  }
});
