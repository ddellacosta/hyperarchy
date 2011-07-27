_.constructor('Views.Lightboxes.FullScreenAgendaItem', Views.Lightboxes.Lightbox, {
  id: "full-screen-agendaItem",

  lightboxContent: function() { with(this.builder) {
    a({'class': "nav link"}, "↖ Back to List").ref('backLink').click(function() {
      History.pushState(null, null, this.agendaItem().question().fullScreenUrl());
    });
    a({'class': "next nav link"}, "Next →").ref('nextLink').click('goToNext');
    a({'class': "prev nav link"}, "← Previous").ref('prevLink').click('goToPrevious');
    span({'class': "nav counter"}).ref('counter');
    subview('agendaItemDetails', Views.Pages.Question.AgendaItemDetails, {fullScreen: true});
  }},

  viewProperties: {
    agendaItem: {
      change: function(agendaItem) {
        this.agendaItemDetails.agendaItem(agendaItem);
        this.agendaItemDetails.notes.notes(agendaItem.notes());

        var question = agendaItem.question();
        var total = question.agendaItems().size();

        if (agendaItem.position() > 1) {
          this.prevLink.show();
        } else {
          this.prevLink.hide();
        }

        if (agendaItem.position() < total) {
          this.nextLink.css('visibility', 'visible');
        } else {
          this.nextLink.css('visibility', 'hidden');
        }

        this.counter.text(agendaItem.position() +  " of " + total);
      }
    },

    beforeShow: function($super) {
      Application.darkenedBackground.addClass('darker');
      $super();
    },

    afterHide: function($super) {
      $super();
      Application.darkenedBackground.removeClass('darker');
    },

    close: function($super) {
      $super();
      History.replaceState(null, null, this.agendaItem().url());
    },

    goToPrevious: function() {
      History.replaceState(null, null, this.agendaItem().previous().fullScreenUrl());
    },

    goToNext: function() {
      History.replaceState(null, null, this.agendaItem().next().fullScreenUrl());
    }
  }
});
