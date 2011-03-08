_.constructor("Views.Columns.CommentsListing", Views.Columns.RecordsListing, {

  liConstructor: Views.Columns.CommentLi,

  headerContent: function() { with(this.builder) {
    h2("Comments");
  }},

  rootAttributes: {'class': "comments"},

  viewProperties: {

    mainRelationForState: function(state) {
      var constructor, parentConstructor;
      if (state.parentTableName === "elections")  {
        constructor = ElectionComment;
        parentConstructor  = Election;
      } else {
        constructor = CandidateComment;
        parentConstructor  = Candidate;
      }
      return parentConstructor.where({id: state.parentRecordId}).joinThrough(constructor);
    },

    additionalRelationsForState: function(state) {
      var constructor, parentConstructor, commentRelation;
      if (state.parentTableName === "elections")  {
        constructor = ElectionComment;
        parentConstructor  = Election;
      } else {
        constructor = CandidateComment;
        parentConstructor  = Candidate;
      }
      commentRelation = parentConstructor.where({id: state.parentRecordId}).joinThrough(constructor);
      return commentRelation.join(User).on(constructor.creatorId.eq(User.id));
    },

    mainRelation: {
      afterChange: function(mainRelation) {
        this.mainList.relation(mainRelation);
      }
    }
  }
});
