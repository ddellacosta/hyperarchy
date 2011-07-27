_.constructor('Views.Pages.Meeting.RankingLi', Monarch.View.Template, {
  content: function(params) { with(this.builder) {
    li({'class': "ranking"}, function() {
      subview('spinner', Views.Components.Spinner);
      div().ref('body');
    }).mousedown('handleMousedown');
  }},

  viewProperties: {
    initialize: function() {
      if (this.ranking) {
        this.agendaItem = this.ranking.agendaItem();
        this.observeRankingPosition();
      }
      this.body.bindMarkdown(this.agendaItem, 'body');
      this.outstandingRequests = 0;
    },
    
    observeRankingPosition: function() {
      this.data('position', this.ranking.position());
      this.rankingUpdateSubscription = this.ranking.onUpdate(function() {
        this.data('position', this.ranking.position());
      }, this);
    },

    afterRemove: function() {
      if (this.rankingUpdateSubscription) this.rankingUpdateSubscription.destroy();
    },
    
    handleListDrop: function() {
      var agendaItem = this.agendaItem;

      var nextLi = this.next('li');
      var nextPosition = nextLi.data('position');

      var prevLi = this.prev('li');
      var prevPosition = prevLi.data('position');

      if (prevPosition === undefined) prevPosition = nextPosition + 128;
      if (nextPosition === undefined) nextPosition = prevPosition - 128;

      var position = (nextPosition + prevPosition) / 2;
      this.data('position', position);

      this.loading(true);
      this.outstandingRequests++;
      Ranking.createOrUpdate(Application.currentUser(), agendaItem, position)
        .success(function(ranking) {
          if (this.ranking) {
            ranking.trackUpdate();
          } else {
            ranking.trackCreate();
            this.ranking = ranking;
            this.observeRankingPosition();
          }
          this.outstandingRequests--;
          if (this.outstandingRequests === 0) this.loading(false);
        }, this);
    },

    handleMousedown: function() {
      if (this.ranking && this.ranking.userId() !== Application.currentUserId()) return false;
    },

    loading: {
      change: function(loading) {
        if (loading) {
          this.spinner.show();
        } else {
          this.spinner.hide();
        }
      }
    }
  }
});
