_.constructor("Views.ColumnLayout.Elections", Views.ColumnLayout.ColumnView, {

  liConstructor: Views.ColumnLayout.ElectionLi,

  headerContent: function() {with(this.builder) {
    h2("Answers");
  }},
  detailsArea: function() {with(this.builder) {
    subview('detailsArea', Views.ColumnLayout.DetailsArea, {
      rootAttributes: {'class': "detailsArea"}
    });
  }},
  rankedList: null,



  viewProperties: {

    getMainRelationFromColumnState: function(state) {
      if (state.parentRecordId) {
        return Election.where({organizationId: state.parentRecordId})
      } else {
        return Election.where({id: state.recordId});
      }
    },

    getOtherRelationsFromColumnState: function(state) {
      var mainRelation = this.getMainRelationFromColumnState(state);
      return [
        mainRelation.join(User).on(Election.creatorId.eq(User.id))
      ];
    },

    mainRelation: {
      afterChange: function(mainRelation) {
        this.mainList.relation(mainRelation);
      }
    },

    adjustHeight: function(minHeight) {
      this.mainList.fillVerticalSpace(20, minHeight - 40);
    },

    setCurrentOrganizationId: function() {
      Application.currentOrganizationId(1);
    }
  }
});
