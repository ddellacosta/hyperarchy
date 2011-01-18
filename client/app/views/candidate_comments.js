_.constructor("Views.CandidateComments", View.Template, {
  content: function() { with(this.builder) {
    div({'class': "commentsContainer"}, function() {
      subview('candidateCommentsList', Views.SortedList, {
        rootAttributes: {'class': "commentsList nonEditable" },
        buildElement: function(candidateComment) {
          return Views.CandidateCommentLi.toView({candidateComment: candidateComment});
        }
      });

      div({'class': "createCommentForm"}, function() {
        textarea().ref('createCommentTextarea');
        div({'class': "clear"});

        button({'class': "createCommentButton"}, "Make a Comment")
          .ref('createCommentButton')
          .click('createComment');

        div({'class': "loading", style: "display: none;"}).ref("createCommentSpinner");
        div({'class': "clear"});
      }).ref('createCommentForm');

      div({'class': "loading fetching", style: "display: none"}).ref('loading');
    });
  }},

  viewProperties: {

    candidate: {
      afterChange: function(candidate) {
        this.candidateCommentsList.relation(candidate.candidateComments());
      }
    },

    afterRemove: function() {
      this.candidateCommentsList.remove();
    },

    fadeIn: function($super) {
      $super();
      this.adjustHeight();
    },

    afterShow: function() {
      this.adjustHeight();
    },

    adjustHeight: function() {
      this.candidateCommentsList.fillVerticalSpace(50, 200);
      this.loading.position({
        my: 'center center',
        at: 'center center',
        of: this.rankedCandidatesList
      });
    },

    createComment: function(elt, e) {
      this.createCommentTextarea.blur();
      e.preventDefault();
      if (this.commentCreationDisabled) return;

      var body = this.createCommentTextarea.val();
      if (body === "") return;
      this.createCommentTextarea.val("");

//      this.createCommentTextarea.attr('disabled', true);
      this.commentCreationDisabled = true;

      this.createCommentSpinner.show();
      this.candidate().candidateComments().create({body: body})
        .onSuccess(function() {
          this.createCommentSpinner.hide();
          this.commentCreationDisabled = false;
//          this.createCommentTextarea.attr('disabled', false);
        }, this);
    }
  }
});
