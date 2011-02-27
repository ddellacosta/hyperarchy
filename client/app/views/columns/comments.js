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
      afterChange: function(state) {
        this.startLoading();
        var commentRelation, relationsToFetch, parentTable, commentTable;
        if (state.parentTableName === "elections")  {
          parentTable = Election;
          commentTable = ElectionComment;
        }
        if (state.parentTableName === "candidates")  {
          parentTable = Candidate;
          commentTable = CandidateComment;
        }
        commentRelation = parentTable.where({id: state.parentRecordId}).joinThrough(commentTable);
        relationsToFetch = [
          commentRelation,
          commentRelation.join(User).on(commentTable.creatorId.eq(User.id))
        ];
        Server.fetch(relationsToFetch).onSuccess(function() {
          this.commentsList.relation(commentRelation);
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
        of: this.commentsList
      });
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
