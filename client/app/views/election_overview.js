_.constructor("Views.ElectionOverview", View.Template, {
  content: function() { with(this.builder) {
    div({'id': "electionOverview"}, function() {
      div({'class': "headerContainer"}, function() {
        div({id: "electionBodyContainer", 'class': "grid8"}, function() {
          div({'class': "expandArrow", style: "display: none;"})
            .ref('expandLink')
            .click('expandOrContract');

          div({id: "electionBodyContainerRight"}, function() {
            h2({'class': "electionBody"}).ref('bodyElement');

            textarea({'class': "electionBody", style: "display: none;"})
              .ref('bodyTextarea')
              .bind('keyup paste', 'enableOrDisableSaveButton')
              .keydown(function(view, event) {
                if (event.keyCode === 13) {
                  view.updateElectionBody();
                  event.preventDefault();
                }
              });

            div({id: "expandedArea", style: "display: none;"}, function() {
              button("Save")
                .ref('saveButton')
                .click('updateElectionBody');
              button("Delete Question")
                .click('destroyElection');
              div({'class': "loading", style: "display: none;"}).ref('electionSpinner');
              div({'class': "clear"});
            }).ref('expandedArea');
          });
        });

        div({'class': 'grid4'}, function() {
          a({id: "showCreateCandidateFormButton", 'class': "glossyLightGray roundedButton"}, "Suggest An Answer")
            .click('showOrHideCreateCandidateForm')
            .ref('showCreateCandidateFormButton');
        });

        div({'class': "clear"});
      });

      div({'class': "grid4"}, function() {
        div({'class': "columnHeader"}, function() {
          text("Comments");
        });
        subview('electionCommentsList', Views.SortedList, {
          rootAttributes: { id: "electionComments", 'class': "electionComments" },
          buildElement: function(electionComment) {
            return Views.CandidateCommentLi.toView({candidateComment: electionComment});
          }
        });

        div({'class': "createElectionCommentForm"}, function() {
          textarea().ref('createElectionCommentTextarea');
          div({'class': "clear"});

          button({'class': "createElectionCommentButton"}, "Make a Comment")
            .ref('createElectionCommentButton')
            .click('createElectionComment');

          div({'class': "loading", style: "display: none;"}).ref("createElectionCommentSpinner");
          div({'class': "clear"});
        }).ref('createElectionCommentForm');

        div({'class': "clear"});
      });

      div({'class': "grid4"}, function() {
        subview('candidatesList', Views.CandidatesList);
      });

      div({'class': "grid4"}, function() {
        subview('rankedCandidatesList', Views.RankedCandidatesList);
      });

      div({'class': "grid4", style: "display: none;"}, function() {
        div({id: "createCandidateForm", style: "display: none;"}, function() {
          div({'class': "columnHeader"}, function() {
            div({'class': "small cancelX"})
              .ref('hideCreateCandidateFormCancelX')
              .click(function(view) {
                view.hideCreateCandidateForm();
              });
            text("Enter Your Answer");
          });
          
          textarea({id: "shortAnswer"})
            .ref('createCandidateBodyTextarea')
            .keypress(function(view, e) {
              if (e.keyCode === 13) {
                view.createCandidateButton.click();
                return false;
              }
            });
          textarea({id: "optionalDetails", placeholder: "Further Details (Optional)"}).ref('createCandidateDetailsTextarea');
          div({'class': "clear"});

          a({id: "createCandidateButton", 'class': "glossyLightGray roundedButton", href: "#"}, "Suggest This Answer")
            .ref('createCandidateButton')
            .click('createCandidate');

          div({'class': "loading", style: "display: none;"}).ref("createCandidateSpinner");
          div({'class': "clear"});
        }).ref('createCandidateForm');

        div({id: 'createdBy', style: "display: none;"}, function() {
          div({'class': "columnHeader"}, function() {
            text("Question Raised By");
          });
          div({'class': "relatedUser"}, function() {
            subview('creatorAvatar', Views.Avatar, { size: 40 });
            div({'class': "details"}, function() {
              div({'class': "name"}, "").ref('creatorName');
              div({'class': "date"}, "").ref('createdAt');
            });
            div({'class': "clear"});
          });
        }).ref('creatorDiv');

        subview('votesList', Views.VotesList);
      });

      div({'class': "clear"});

      div(function() {
        div({id: "leftContent"}, function() {
          a({id: "back"}, "Back to Questions")
            .click(function() {
              Application.layout.goToOrganization();
            });
        });
      }).ref("subNavigationContent");
    });

  }},

  viewProperties: {
    viewName: 'election',

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle();
      this.defer(function() {
        this.find('textarea').elastic();
      });

      this.defer(function() {
        this.adjustHeight();
      });
      $(window).resize(this.bind(function() {
        this.adjustHeight();
      }));

      this.createCandidateDetailsTextarea.holdPlace();
    },

    navigate: function(state) {
      this.adjustHeight();
      this.electionId(parseInt(state.electionId));
      this.rankingsUserId(state.rankingsUserId || Application.currentUserId);
      Server.post("/visited?election_id=" + state.electionId);

      Application.layout.activateNavigationTab("questionsLink");
      Application.layout.showSubNavigationContent("elections");
    },

    electionId: {
      afterChange: function(electionId, previousElectionId) {
        this.hideElementsWhileLoading();
        var additionalRelations = [
          Election.where({id: electionId}).joinTo(Organization),
          Candidate.where({electionId: electionId}).join(User).on(Candidate.creatorId.eq(User.id))
        ];

        this.startLoading();
        Election.findOrFetch(electionId, additionalRelations)
          .onSuccess(function(election) {
            if (election) {
              election.fetchCommentsAndCommentersIfNeeded();
              this.election(election);
            } else {
              var lastVisitedOrgId = Application.currentUser().lastVisitedOrganization().id();
              $.bbq.pushState({view: 'organization', organizationId: lastVisitedOrgId}, 2);
            }
            this.stopLoading();
            this.showElementsAfterLoading();
          }, this);
      }
    },

    rankingsUserId: {
      afterChange: function(rankingsUserId) {
        var rankingsUser = User.find(rankingsUserId);
        if (!rankingsUser) {
          this.rankedCandidatesList.startLoading();
          User.fetch(rankingsUserId).onSuccess(function() {
            this.rankedCandidatesList.rankingsUser(User.find(rankingsUserId));
          }, this);
        } else {
          this.rankedCandidatesList.rankingsUser(rankingsUser);
        }
      }
    },

    election: {
      afterChange: function(election) {
        Application.currentOrganizationId(election.organizationId());

        this.populateElectionDetails(election);
        this.populateCreator(election);
        this.subscribeToElectionChanges(election);
        this.candidatesList.election(election);
        this.rankedCandidatesList.election(election);
        this.votesList.election(election);
        
        this.electionCommentsList.relation(election.comments());
//        this.populateSubNavigationBar();
      }
    },

//    populateSubNavigationBar: function() {
//      var elections = this.election().organization().elections();
//      this.electionCount.bindHtml(this.election().organization(), 'electionCount');
//
//      var score = this.election().score();
//      var position = elections.where(Election.score.gt(score)).size() + 1;
//      this.electionPosition.html(position);
//
//      var nextElection = elections.where(Election.score.lt(score)).first();
//      if (nextElection) {
//        var nextElectionID = nextElection.id();
//        this.nextElectionLink.show();
//        this.nextElectionLink.click(function() {
//          Application.layout.goToQuestion(nextElectionID);
//        });
//      } else {
//        this.nextElectionLink.hide();
//      }
//      var previousElection = elections.where(Election.score.gt(score)).last();
//      if (previousElection) {
//        var previousElectionID = previousElection.id();
//        this.previousElectionLink.show();
//        this.previousElectionLink.click(function() {
//          Application.layout.goToQuestion(previousElectionID);
//        });
//      } else {
//        this.previousElectionLink.hide();
//      }
//    },

    hideElementsWhileLoading: function() {
      this.showCreateCandidateFormButton.hide();
      this.hideCreateCandidateForm(true);
      this.candidatesList.hide();
      this.rankedCandidatesList.hide();
      this.creatorDiv.hide();
    },

    showElementsAfterLoading: function() {
      if (!this.election()) return;
      if (this.election().candidates().empty()) {
        this.hideCreateCandidateFormCancelX.hide();
        this.showCreateCandidateForm("instantly");
      } else {
        this.candidatesList.show();
        this.rankedCandidatesList.show();
        this.hideCreateCandidateFormCancelX.show();
        this.showCreateCandidateFormButton.show();
        this.hideCreateCandidateForm(true);
      }
    },

    populateElectionDetails: function(election) {
      this.bodyTextarea.val(election.body());
      this.bodyElement.bindHtml(election, 'body');
      if (election.editableByCurrentUser()) {
        this.expandLink.show();
      } else {
        this.expandLink.hide();
      }
      this.contract(true);
      this.adjustHeight();
    },

    populateCreator: function(election) {
      User.findOrFetch(election.creatorId()).onSuccess(function(creator) {
        this.creatorName.html(htmlEscape(creator.fullName()));
        this.createdAt.html(election.formattedCreatedAt());
        this.creatorAvatar.user(creator);
        this.creatorDiv.show();
      }, this);
    },

    subscribeToElectionChanges: function(election) {
      this.subscriptions.destroy();
      this.subscriptions.add(election.remote.field('body').onUpdate(function(newBody) {
        this.bodyTextarea.val(newBody);
      }, this));

      this.subscriptions.add(election.onDestroy(function() {
        this.goToOrganization();
      }, this));

      this.subscriptions.add(election.candidates().onInsert(function() {
        if (this.candidatesList.is(":hidden")) {
          this.showCreateCandidateFormButton.show();
          this.hideCreateCandidateFormCancelX.show();
          this.hideCreateCandidateForm(true);
          this.candidatesList.fadeIn();
          this.rankedCandidatesList.fadeIn();
        }
      }, this));

      this.subscriptions.add(election.candidates().onRemove(function() {
        if (election.candidates().empty()) {
          this.hideCreateCandidateFormCancelX.hide();
          this.candidatesList.fadeOut();
          this.showCreateCandidateFormButton.hide();
          this.rankedCandidatesList.fadeOut(this.bind(function() {
            this.showCreateCandidateForm();
          }));
        }
      }, this));
    },

    showOrHideCreateCandidateForm: function() {
      if (this.createCandidateForm.is(":visible")) {
        this.hideCreateCandidateForm(false, false, "preserveText");
      } else {
        this.showCreateCandidateForm();
      }
      return false;
    },

    showCreateCandidateForm: function(instantly) {
      this.showCreateCandidateFormButton.addClass('pressed');
      this.createCandidateDetailsTextarea.blur();

      var cancelResize = _.repeat(function() {
        this.votesList.adjustHeight();
      }, this);

      var afterFormIsShown = this.bind(function() {
        this.createCandidateBodyTextarea.focus();
        cancelResize();
      });

      if (instantly) {
        this.createCandidateForm.show();
        this.votesList.adjustHeight();
        afterFormIsShown();
      } else {
        this.createCandidateForm.slideDown('fast', afterFormIsShown);
      }
    },

    hideCreateCandidateForm: function(instantly, whenDone, preserveText) {
      this.showCreateCandidateFormButton.removeClass('pressed');

      if (!preserveText) {
        this.createCandidateBodyTextarea.val("");
        this.createCandidateDetailsTextarea.val("");
      }

      if (instantly) {
        this.createCandidateForm.hide();
        this.votesList.adjustHeight();
        if (whenDone) whenDone();
      } else {
        var cancelResize = _.repeat(function() {
          this.votesList.adjustHeight();
        }, this);
        this.createCandidateForm.slideUp('fast', function() {
          cancelResize();
          if (whenDone) whenDone();
        });
      }

      return false;
    },

    createCandidate: function(elt, e) {
      this.createCandidateBodyTextarea.blur();
      this.createCandidateDetailsTextarea.blur();
      e.preventDefault();

      if (this.candidateCreationDisabled) return;

      var body = this.createCandidateBodyTextarea.val();
      var details = this.createCandidateDetailsTextarea.val();
      if (body === "") return;

      this.createCandidateBodyTextarea.attr('disabled', true);
      this.createCandidateDetailsTextarea.attr('disabled', true);
      this.candidateCreationDisabled = true;

      this.createCandidateSpinner.show();
      this.election().candidates().create({body: body, details: details})
        .onSuccess(function() {
          this.createCandidateSpinner.hide();
          this.hideCreateCandidateForm(false, this.bind(function() {
            this.createCandidateBodyTextarea.attr('disabled', false);
            this.createCandidateDetailsTextarea.attr('disabled', false);
            this.candidateCreationDisabled = false;
          }));
        }, this);
    },

    createElectionComment: function(elt, e) {
      this.createElectionCommentTextarea.blur();
      e.preventDefault();
      if (this.commentCreationDisabled) return;

      var body = this.createElectionCommentTextarea.val();
      if (body === "") return;
      this.createElectionCommentTextarea.val("");
      this.createElectionCommentTextarea.keyup();
      this.commentCreationDisabled = true;

      this.createElectionCommentSpinner.show();
      this.election().comments().create({body: body})
        .onSuccess(function() {
          this.createElectionCommentSpinner.hide();
          this.commentCreationDisabled = false;
        }, this);
    },

    goToOrganization: function() {
      $.bbq.pushState({view: "organization", organizationId: this.election().organizationId() }, 2);
    },

    goToElection: function(id) {
      $.bbq.pushState({view: "election", electionId: id}, 2);
    },

    expandOrContract: function() {
      if (this.expanded) {
        this.contract();
      } else {
        this.expand();
      }
    },

    expand: function() {
      this.expanded = true;
      this.expandLink.addClass('expanded');
      this.bodyTextarea.show();
      this.bodyTextarea.keyup();
      this.bodyTextarea.focus();
      this.bodyElement.hide();

      $(window).resize();
      this.expandedArea.slideDown('fast', _.repeat(function() {
        $(window).resize();
      }));
    },

    contract: function(dontAnimate) {
      this.expandLink.removeClass('expanded');
      this.expanded = false;
      this.bodyTextarea.hide();
      this.bodyElement.show();

      if (dontAnimate) {
        this.expandedArea.hide();
        $(window).resize();
      } else {
        this.expandedArea.slideUp('fast', _.repeat(function() {
          $(window).resize();
        }));
      }

      this.adjustHeight();
    },

    enableOrDisableSaveButton: function() {
      if (this.bodyTextarea.val() === this.election().body()) {
        this.saveButton.attr('disabled', true);
      } else {
        this.saveButton.attr('disabled', false);
      }
    },

    updateElectionBody: function() {
      this.electionSpinner.show();
      this.election().update({body: this.bodyTextarea.val()})
        .onSuccess(function() {
          this.electionSpinner.hide();
          this.expandOrContract();
        }, this);
    },

    destroyElection: function() {
      this.electionSpinner.show();
      this.election().destroy()
        .onSuccess(function() {
          this.electionSpinner.hide();
        }, this);
    },

    startLoading: function() {

    },

    stopLoading: function() {
      
    },

    adjustHeight: function() {
      if (!this.is(":visible")) return;

      Application.layout.zeroScroll();
      this.fillVerticalSpace(40, 300);
      this.candidatesList.adjustHeight();
      this.rankedCandidatesList.adjustHeight();
    }
  }
});
