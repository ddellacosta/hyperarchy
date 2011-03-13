_.constructor("Views.ColumnLayout.ElectionsView", Views.ColumnLayout.ExpandableRecordsView, {

  tableName: "elections",
  liTemplate:      Views.ColumnLayout.ElectionLi,
  detailsTemplate: Views.ColumnLayout.ElectionDetails,

  headerContent: function() {with(this.builder) {
    h2("Questions");
  }},

  viewProperties: {

    mainRelationToFetch: function(state) {
      if (state.parentRecordId) {
        return Election.where({organizationId: state.parentRecordId})
      } else {
        return Election.where({id: state.recordId});
      }
    },

    otherRelationsToFetch: function(electionsRelation) {
      return [
        electionsRelation.join(User).on(Election.creatorId.eq(User.id))
      ];
    },

    mainRelation: {
      afterChange: function(electionsRelation) {
        this.mainList.relation(electionsRelation);
      }
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    }
  }
});
