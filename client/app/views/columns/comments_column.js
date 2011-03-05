_.constructor("Views.Columns.CommentsColumn", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "comments", style: "display: none;"}, function() {
      div({'class': "columnHeader"}, function() {
        h2("Comments");
      });

      div({'class': "columnBody"}, function() {
        subview('commentsList', Views.SortedList, {
          rootAttributes: {'class': "commentsList"},
          buildElement: function(comment) {
            return Views.Columns.CommentLi.toView({record: comment});
          }
        });

        div({'class': "loading"}).ref("loading");
      });
      
    });
  }},

  viewProperties: {

    relativeWidth: 1,

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
      this.commentsList.buildElement = this.bind(function(comment) {
        return Views.Columns.CommentLi.toView({
          record: comment,
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
          var commentRelation, relationsToFetch, constructor, parentConstructor;
          if (state.parentTableName === "elections")  {
            constructor = ElectionComment;
            parentConstructor  = Election;
          }
          if (state.parentTableName === "candidates")  {
            constructor = CandidateComment;
            parentConstructor  = Candidate;
          }
          commentRelation = parentConstructor.where({id: state.parentRecordId}).joinThrough(constructor);
          relationsToFetch = [
            commentRelation,
            commentRelation.join(User).on(constructor.creatorId.eq(User.id))
          ];
          Server.fetch(relationsToFetch).onSuccess(function() {
            if (this.containingColumn.isFirst()) this.setCurrentOrganizationId();
            this.commentsList.relation(commentRelation);
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
