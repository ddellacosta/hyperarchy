_.constructor('Views.Pages.Election.CandidateLi', Monarch.View.Template, {
  content: function(params) { with(this.builder) {
    li({'class': "candidate"}, function() {
      div({'class': "more"}, '…');
      div({'class': "status "}).ref('status');
      div({'class': "position"}, params.candidate.position()).ref('position');
      div({'class': "body"}, params.candidate.body()).ref('body');
    });
  }},

  viewProperties: {
    initialize: function() {
      this.data('candidateId', this.candidate.id());

      this.draggable({
        connectToSortable: '#ranked-candidates ol',
        appendTo: '#election',
        revert: 'invalid',
        delay: this.dragDelay,
        revertDuration: 100,
        helper: this.hitch('createFixedWidthClone'),
        zIndex: 2,
        start: this.hitch('handleDragStart'),
        cancel: '.expandArrow, .tooltipIcon, .noDrag'
      });

      this.click(this.bind(function() {
        History.pushState(null, null, this.candidate.url());
      }));
    },

    dragDelay: 100,

    createFixedWidthClone: function() {
      return this.clone().width(this.width());
    },

    handleDragStart: function() {
      History.pushState(null, null, this.candidate.election().url());
    },

    ranking: {
      write: function(ranking) {
        this.status.removeClass("positive negative");
        if (ranking) this.status.addClass(ranking.position() > 0 ? 'positive' : 'negative');
      }
    }
  }
});
