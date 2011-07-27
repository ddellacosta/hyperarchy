_.constructor("Ranking", Model.Record, {
  constructorProperties: {
    initialize: function() {
      this.columns({
        agendaItemId: 'key',
        questionId: 'key',
        voteId: 'key',
        userId: 'key',
        position: 'float'
      });

      this.defaultOrderBy('position desc');

      this.belongsTo('agendaItem');
      this.belongsTo('question');
      this.belongsTo('user');
    },

    createOrUpdate: function(user, agendaItem, position) {
      var future = new Monarch.Http.AjaxFuture();

      $.ajax({
        type: 'post',
        url: '/rankings',
        dataType: 'data+records',
        data: {
          user_id: user.id(),
          question_id: agendaItem.questionId(),
          agendaItem_id: agendaItem.id(),
          position: position
        },
        success: function(data) {
          future.triggerSuccess(Ranking.find(data.ranking_id));
        }
      });

      return future;
    }
  },

  mixpanelNote: function() {
    return this.agendaItem().body();
  }
});
