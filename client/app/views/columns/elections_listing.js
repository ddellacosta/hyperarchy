_.constructor("Views.Columns.ElectionsListing", Views.Columns.RecordsListing, {

  liConstructor: Views.Columns.ElectionLi,

  headerContent: function() { with(this.builder) {
    h2("Questions");
  }},

  rootAttributes: {'class': "elections"},

  viewProperties: {

    mainRelationForState: function(state) {
      if (state.parentRecordId) {
        return Election.where({organizationId: state.parentRecordId})
      } else {
        return Election.where({id: state.recordId});
      }
    },

    additionalRelationsForState: function(state) {
      var mainRelation = this.mainRelationForState(state);
      return [
        mainRelation.join(User).on(Election.creatorId.eq(User.id))
      ];
    },

    mainRelation: {
      afterChange: function(mainRelation) {
        this.mainList.relation(mainRelation);
      }
    }
  }
});
