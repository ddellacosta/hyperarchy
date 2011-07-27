_.constructor('Views.Pages.Meeting.AgendaItemLi', Monarch.View.Template, {
  content: function(params) { with(this.builder) {
    li({'class': "agendaItem"}, function() {
      div({'class': "more"}, '…').ref('ellipsis');
      if (!params.fullScreen) div({'class': "status "}).ref('status');
      div({'class': "position"}, params.agendaItem.position()).ref('position');
      div({'class': "body"}).ref('body');
    });
  }},

  viewProperties: {
    initialize: function() {
      this.data('agendaItemId', this.agendaItem.id());

      this.body.markdown(this.agendaItem.body());

      if (this.fullScreen) {
        this.click(this.bind(function() {
          History.replaceState(null, null, this.agendaItem.fullScreenUrl());
        }));
      } else {
        this.draggable({
          connectToSortable: '#ranked-agendaItems ol',
          appendTo: '#meeting',
          revert: 'invalid',
          delay: this.dragDelay,
          revertDuration: 100,
          helper: this.hitch('createFixedWidthClone'),
          zIndex: 2,
          start: this.hitch('handleDragStart'),
          cancel: '.expandArrow, .tooltipIcon, .noDrag'
        });

        this.click(this.bind(function() {
          if (this.is('.selected')) {
            History.replaceState(null, null, this.agendaItem.meeting().url());
          } else {
            History.replaceState(null, null, this.agendaItem.url());
          }
        }));
      }


      this.showOrHideEllipsis();
    },

    dragDelay: 100,

    createFixedWidthClone: function() {
      return this.clone().width(this.width());
    },

    handleDragStart: function() {
      History.replaceState(null, null, this.agendaItem.meeting().url());
    },

    ranking: {
      write: function(ranking) {
        this.status.removeClass("positive negative");
        if (ranking) this.status.addClass(ranking.position() > 0 ? 'positive' : 'negative');
      }
    },

    showOrHideEllipsis: function() {
      if (this.agendaItem.details() || this.agendaItem.noteCount() > 0) {
        this.ellipsis.show();
      } else {
        this.ellipsis.hide();
      }
    }
  }
});
