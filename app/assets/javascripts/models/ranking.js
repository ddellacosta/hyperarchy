_.constructor("Ranking", Model.Record, {
  constructorProperties: {
    initialize: function() {
      this.columns({
        agendaItemId: 'key',
        meetingId: 'key',
        voteId: 'key',
        userId: 'key',
        position: 'float'
      });

      this.defaultOrderBy('position desc');

      this.belongsTo('agendaItem');
      this.belongsTo('meeting');
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
          meeting_id: agendaItem.meetingId(),
          agenda_item_id: agendaItem.id(),
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
