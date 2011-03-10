_.constructor("Views.ColumnLayout.Comments", Views.ColumnLayout.ColumnView, {

  liConstructor: Views.ColumnLayout.CommentLi,

  headerContent: function() { with(this.builder) {
    h2("Comments");
  }},

  viewProperties: {

    relativeWidth: 1,

    getMainRelationFromColumnState: function(state) {
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

    getOtherRelationsFromColumnState: function(state) {
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
