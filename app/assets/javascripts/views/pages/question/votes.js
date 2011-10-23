//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

_.constructor('Views.Pages.Question.Votes', OldMonarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "votes"}, function() {
      h2(function() {
        raw('&nbsp;')
      }).ref('header');
      subview("list", Views.Components.SortedList, {
        buildElement: function(vote) {
          return Views.Pages.Question.VoteLi.toView({vote: vote});
        },
      });
    });
  }},

  viewProperties: {

    initialize: function() {
      this.list.onInsert = this.hitch('adjustVoteCount');
      this.list.onRemove = this.hitch('adjustVoteCount');
    },

    votes: {
      change: function(votes) {
        this.list.relation(votes);
        this.adjustVoteCount();
        this.highlightSelectedVote();
      }
    },

    selectedVoterId: {
      change: function(voterId) {
        if (this.votes()) this.highlightSelectedVote();
      }
    },

    highlightSelectedVote: function() {
      this.list.children().removeClass('selected');
      var vote = this.votes().find({userId: this.selectedVoterId()});
      if (vote) {
        this.list.elementForRecord(vote).addClass('selected');
        vote.trackView();
      }
    },

    adjustVoteCount: function() {
      var voteCount = this.votes().size();
      switch(voteCount) {
        case 0:
          this.header.text('No Votes Yet');
          break;
        case 1:
          this.header.text('1 Vote');
          break;
        default:
          this.header.text(voteCount + ' Votes');
      }
    },

    loading: {
      change: function(loading) {
        if (loading) {
          this.hide();
        } else {
          this.show();
        }
      }
    }
  }
});
