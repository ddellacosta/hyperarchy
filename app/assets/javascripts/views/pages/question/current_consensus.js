_.constructor('Views.Pages.Question.CurrentConsensus', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "current-consensus"}, function() {
      subview('list', Views.Components.SortedList, {
        buildElement: function(agendaItem) {
          return Views.Pages.Question.AgendaItemLi.toView({agendaItem: agendaItem});
        },

        onUpdate: function(element, record) {
          element.position.text(record.position());
          element.body.markdown(record.body());
        }
      });
    })
  }},

  viewProperties: {

    attach: function($super) {
      $super();
      this.registerInterest(Application, 'onCurrentUserChange', this.hitch('handleCurrentUserChange'));
    },

    handleCurrentUserChange: function() {
      if (! this.agendaItems()) return;
      this.updateStatuses();
      this.observeCurrentUserRankings();
    },

    agendaItems: {
      change: function(agendaItems) {
        this.list.relation(agendaItems);
        this.updateStatuses();
        this.observeCurrentUserRankings();
        this.observeAgendaItems();
      }
    },

    observeCurrentUserRankings: function() {
      var currentUserRankings = Application.currentUser().rankings();
      this.registerInterest('rankings', currentUserRankings, 'onUpdate', this.hitch('updateStatus'));
      this.registerInterest('rankings', currentUserRankings, 'onInsert', this.hitch('updateStatus'));
      this.registerInterest('rankings', currentUserRankings, 'onRemove', this.hitch('clearStatus'));
    },

    observeAgendaItems: function() {
      this.registerInterest('agendaItems', this.agendaItems(), 'onUpdate', function(agendaItem, changeset) {
        if (changeset.noteCount || changeset.details) {
          this.list.elementForRecord(agendaItem).showOrHideEllipsis();
        }
      }, this);
    },

    selectedAgendaItem: {
      change: function(selectedAgendaItem) {
        this.list.find('li').removeClass('selected');
        if (selectedAgendaItem) this.list.elementForRecord(selectedAgendaItem).addClass('selected');
      }
    },

    updateStatuses: function() {
      var currentUserRankings = Application.currentUser().rankings();
      this.agendaItems().each(function(agendaItem) {
        var ranking = currentUserRankings.find({agendaItemId: agendaItem.id()});
        this.list.elementForRecord(agendaItem).ranking(ranking);
      }, this);
    },

    updateStatus: function(ranking) {
      var agendaItem = ranking.agendaItem();
      this.list.elementForRecord(agendaItem).ranking(ranking);
    },

    clearStatus: function(ranking) {
      var agendaItem = ranking.agendaItem();
      if (!agendaItem) return;
      this.list.elementForRecord(agendaItem).ranking(null);
    }
  }
});
