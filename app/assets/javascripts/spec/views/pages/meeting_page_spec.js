//= require spec/spec_helper

describe("Views.Pages.Meeting", function() {
  var meetingPage;
  beforeEach(function() {
    renderLayout();
    Application.height(700);
    meetingPage = Application.meetingPage;
    meetingPage.show();
  });

  describe("when the params hash is assigned", function() {
    var currentUser, meeting, agendaItem1, agendaItem2, currentUserRanking1, currentUserRanking2;
    var otherUser, otherUser2, meetingNoteCreator, agendaItemNoteCreator, otherUserRanking1, otherUserRanking2;

    beforeEach(function() {
      enableAjax();
      currentUser = login();
      usingBackdoor(function() {
        var meetingCreator = User.create();
        var team = Team.create({privacy: "public"});
        team.memberships().create({userId: Application.currentUserId()});
        meeting = team.meetings().create();
        meeting.update({creatorId: meetingCreator.id()});
        otherUser = User.create();
        otherUser2 = User.create();
        meetingNoteCreator = User.create();
        agendaItemNoteCreator = User.create();
        currentUser.memberships().create({teamId: meeting.teamId()});
        otherUser.memberships().create({teamId: meeting.teamId()});
        meetingNoteCreator.memberships().create({teamId: meeting.teamId()});
        agendaItemNoteCreator.memberships().create({teamId: meeting.teamId()});
        var meetingNote = meeting.notes().create();
        meetingNote.update({creatorId: meetingNoteCreator.id()});
        agendaItem1 = meeting.agendaItems().create();
        var agendaItemNote = agendaItem1.notes().create();
        agendaItemNote.update({creatorId: agendaItemNoteCreator.id()});
        agendaItem2 = meeting.agendaItems().create({creatorId: otherUser2.id()});
        currentUserRanking1 = meeting.rankings().create({userId: currentUser.id(), position: 64, agendaItemId: agendaItem1.id()});
        currentUserRanking2 = meeting.rankings().create({userId: currentUser.id(), position: -64, agendaItemId: agendaItem2.id()});
        otherUserRanking1 = meeting.rankings().create({userId: otherUser.id(), position: 64, agendaItemId: agendaItem1.id()});
        otherUserRanking2 = meeting.rankings().create({userId: otherUser.id(), position: -64, agendaItemId: agendaItem2.id()});
      });
      fetchInitialRepositoryContents();
    });

    describe("if the meetingId changes", function() {
      function expectMeetingDataFetched() {
        expect(Meeting.find(meeting.id())).toEqual(meeting);
        expect(meeting.creator()).toBeDefined();
        expect(meeting.agendaItems().size()).toBe(2);
        expect(meeting.agendaItems().join(User).on(User.id.eq(AgendaItem.creatorId)).size()).toBe(2);
        expect(meeting.rankings().size()).toBeGreaterThan(0);
        expect(meeting.votes().size()).toBeGreaterThan(0);
        expect(meeting.voters().size()).toBe(meeting.votes().size());
        expect(meeting.notes().size()).toBeGreaterThan(0);
        expect(meeting.noters().size()).toBe(meeting.notes().size());
      }

      function expectMeetingDataAssigned() {
        expect(Application.currentTeamId()).toBe(meeting.teamId());
        expect(meetingPage.meeting()).toEqual(meeting);
        expect(meetingPage.currentConsensus.agendaItems()).toEqual(meeting.agendaItems());
        expect(meetingPage.votes.votes().tuples()).toEqual(meeting.votes().tuples());
        expect(meetingPage.notes.notes().tuples()).toEqual(meeting.notes().tuples());
      }

      describe("if no voterId or agendaItemId is specified", function() {
        it("fetches the meeting data before assigning relations to the subviews and the current org id", function() {
          waitsFor("fetch to complete", function(complete) {
            meetingPage.params({ meetingId: meeting.id() }).success(complete);
            expect(meetingPage.votes.selectedVoterId()).toBe(Application.currentUserId());

            expect(meetingPage.body).toBeHidden();
            expect(meetingPage.spinner).toBeVisible();
          });

          runs(function() {
            expectMeetingDataFetched();
            expectMeetingDataAssigned();

            expect(meetingPage.body).toBeVisible();
            expect(meetingPage.spinner).toBeHidden();

            expect(meetingPage.rankedAgendaItems.rankings().tuples()).toEqual(meeting.rankings().where({userId: currentUser.id()}).tuples());
            expect(meetingPage.rankedAgendaItems).toBeVisible();
            expect(meetingPage.agendaItemDetails).not.toHaveClass('active');
            expect(meetingPage.votes.selectedVoterId()).toBe(Application.currentUserId());
            expect(meetingPage.rankedAgendaItemsHeader.text()).toBe("Your Ranking");
            expect(meetingPage.newAgendaItemLink).not.toHaveClass('active');
            expect(meetingPage.backLink).toBeHidden();
          });
        });
      });

      describe("if the voterId is specified", function() {
        it("fetches the meeting data and the specified voter's rankings before assigning relations to the subviews", function() {
          waitsFor("fetch to complete", function(complete) {
            meetingPage.params({ meetingId: meeting.id(), voterId: otherUser.id() }).success(complete);
            expect(meetingPage.rankedAgendaItems.sortingEnabled()).toBeFalsy();
            expect(meetingPage.votes.selectedVoterId()).toEqual(otherUser.id());
          });

          runs(function() {
            expectMeetingDataFetched();
            expectMeetingDataAssigned();

            expect(meeting.rankingsForUser(otherUser).size()).toBeGreaterThan(0);

            expect(meetingPage.rankedAgendaItems.rankings().tuples()).toEqual(meeting.rankingsForUser(otherUser).tuples());
            expect(meetingPage.rankedAgendaItemsHeader.text()).toBe(otherUser.fullName() + "'s Ranking");
            expect(meetingPage.rankedAgendaItems).toBeVisible();
            expect(meetingPage.agendaItemDetails).not.toHaveClass('active');
            expect(meetingPage.newAgendaItemLink).not.toHaveClass('active');
            expect(meetingPage.backLink).toBeVisible();
          });
        });
      });

      describe("if the agendaItemId is specified", function() {
        describe("if the agendaItem exists", function() {
          it("fetches the meeting data along with the agendaItem's notes and noters before assigning relations to the subviews and the selectedAgendaItem to the currentConsensus and agendaItemDetails", function() {
            waitsFor("fetch to complete", function(complete) {
              meetingPage.params({ meetingId: meeting.id(), agendaItemId: agendaItem1.id() }).success(complete);
              expect(meetingPage.votes.selectedVoterId()).toBeFalsy();
            });

            runs(function() {
              expectMeetingDataFetched();
              expect(agendaItem1.notes().size()).toBeGreaterThan(0);
              expect(agendaItem1.noters().size()).toBe(agendaItem1.notes().size());

              expectMeetingDataAssigned();

              expect(meetingPage.currentConsensus.selectedAgendaItem()).toEqual(agendaItem1);
              expect(meetingPage.agendaItemDetails.agendaItem()).toEqual(agendaItem1);
              expect(meetingPage.rankedAgendaItems).not.toHaveClass('active');
              expect(meetingPage.agendaItemDetails).toBeVisible();
              expect(meetingPage.votes.selectedVoterId()).toBeFalsy();
              expect(meetingPage.newAgendaItemLink).not.toHaveClass('active');
              expect(meetingPage.backLink).toBeVisible();
            });
          });
        });

        describe("if the agendaItem does NOT exist", function() {
          it("navigates to the current user's ranking", function() {
            beforeEach(function() {
              spyOn(Application, 'showPage');
            });

            waitsFor("fetch to complete", function(complete) {
              var nonExistentAgendaItemId = 1029341234;
              meetingPage.params({ meetingId: meeting.id(), agendaItemId: nonExistentAgendaItemId }).success(complete);
            });

            runs(function() {
              expect(Path.routes.current).toBe(meeting.url());
            });
          });
        });
      });

      describe("if 'new' is specified as the agendaItemId", function() {
        it("fetches the meeting data assigning relations to the subviews and showing the agendaItem details form in 'new' mode", function() {

          waitsFor("fetch to complete", function(complete) {
            expect(meetingPage.newAgendaItemLink).not.toHaveClass('active');
            meetingPage.params({ meetingId: meeting.id(), agendaItemId: 'new' }).success(complete);
            expect(meetingPage.newAgendaItemLink).toHaveClass('active');
            expect(meetingPage.votes.selectedVoterId()).toBeFalsy();
          });

          runs(function() {
            expectMeetingDataFetched();
            expectMeetingDataAssigned();

            expect(meetingPage.agendaItemDetails).toHaveClass('active');
            expect(meetingPage.agendaItemDetails.form).toBeVisible();
            expect(meetingPage.agendaItemDetails.agendaItem()).toBeFalsy();
            expect(meetingPage.currentConsensus.selectedAgendaItem()).toBeFalsy();
            expect(meetingPage.votes.selectedVoterId()).toBeFalsy();
            expect(meetingPage.backLink).toBeVisible();

            // now the new agendaItem link actually submits the agendaItem instead of showing the form
            expect(meetingPage.newAgendaItemLink).toHaveClass('active');
            useFakeServer();

            meetingPage.agendaItemDetails.editableBody.val("AgendaItem Body");

            meetingPage.newAgendaItemLink.click();
            expect(Server.creates.length).toBe(1);
            expect(Server.lastCreate.record.body()).toBe("AgendaItem Body");
            Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

            expect(Path.routes.current).toBe(meeting.url());
          });
        });
      });

      describe("if the meeting is already present in the repository", function() {
        it("assigns the meeting and agendaItems before fetching additional data, and puts spinners on the ranking and votes", function() {
          synchronously(function() {
            meeting.fetch();
            meeting.agendaItems().fetch();
            User.fetch(meeting.creatorId());
          });

          waitsFor("fetch to complete", function(complete) {
            meetingPage.params({meetingId: meeting.id()}).success(complete);
            expect(Application.currentTeamId()).toBe(meeting.teamId());
            expect(meetingPage.meeting()).toEqual(meeting);
            expect(meetingPage.currentConsensus.agendaItems().tuples()).toEqual(meeting.agendaItems().tuples());
            expect(meetingPage.rankedAgendaItems.loading()).toBeTruthy();
            expect(meetingPage.votes.loading()).toBeTruthy();
            expect(meetingPage.notes.loading()).toBeTruthy();
          });

          runs(function() {
            expect(meetingPage.rankedAgendaItems.rankings()).toBeDefined();
            expect(meetingPage.rankedAgendaItems.loading()).toBeFalsy();
            expect(meetingPage.votes.loading()).toBeFalsy();
            expect(meetingPage.notes.loading()).toBeFalsy();
          })
        });
      });

      describe("if the meeting does not exist", function() {
        it("navigates to the current user's default team url", function() {
          waitsFor("fetch to complete", function(complete) {
            meetingPage.params({meetingId: -27}).success(complete);
          });

          runs(function() {
            expect(Path.routes.current).toBe(currentUser.defaultTeam().url());
          });
        });
      });
    });

    describe("when the meetingId does not change", function() {
      beforeEach(function() {
        waitsFor("fetch to complete", function(complete) {
          meetingPage.params({ meetingId: meeting.id() }).success(complete);
        });
      });

      describe("if no voterId or agendaItemId is specified", function() {
        it("hides the agendaItem details and assigns relations to the subviews, shows the current user's rankings and enables sorting", function() {
          waitsFor("fetch to complete", function(complete) {
            meetingPage.params({ meetingId: meeting.id(), agendaItemId: agendaItem2.id() }).success(complete);
          });

          runs(function() {
            meetingPage.params({ meetingId: meeting.id() });

            expect(meetingPage.agendaItemDetails).not.toHaveClass('active');
            expect(meetingPage.votes.selectedVoterId()).toBe(Application.currentUserId());
            expect(meetingPage.rankedAgendaItems.rankings().tuples()).toEqual(currentUser.rankingsForMeeting(meeting).tuples());
            expect(meetingPage.currentConsensus.selectedAgendaItem()).toBeFalsy();
            expect(meetingPage.rankedAgendaItems.sortingEnabled()).toBeTruthy();
            expect(meetingPage.rankedAgendaItemsHeader.text()).toBe("Your Ranking");
            expect(meetingPage.rankedAgendaItems).toBeVisible();
            expect(meetingPage.agendaItemDetails).not.toHaveClass('active');
            expect(meetingPage.votes.selectedVoterId()).toBe(Application.currentUserId());
            expect(meetingPage.rankedAgendaItemsHeader.text()).toBe("Your Ranking");
            expect(meetingPage.backLink).toBeHidden();
          });
        });
      });

      describe("if the voterId is specified", function() {
        it("fetches the specified voter's rankings in addition to the current user's before assigning relations to the subviews and disables sorting because they won't be the current user", function() {
          waitsFor("fetch to complete", function(complete) {
            meetingPage.params({ meetingId: meeting.id(), voterId: otherUser.id() }).success(complete);
            expect(meetingPage.rankedAgendaItemsHeader.text()).toBe(otherUser.fullName() + "'s Ranking");
            expect(meetingPage.currentConsensus.selectedAgendaItem()).toBeFalsy();
            expect(meetingPage.rankedAgendaItems.sortingEnabled()).toBeFalsy();

            expect(meetingPage.rankedAgendaItems.loading()).toBeTruthy();
            expect(meetingPage.notes.loading()).toBeFalsy();
            expect(meetingPage.votes.loading()).toBeFalsy();
          });

          runs(function() {
            expect(meetingPage.rankedAgendaItems.loading()).toBeFalsy();

            expect(currentUser.rankings().size()).toBeGreaterThan(0);
            expect(meetingPage.rankedAgendaItems.rankings().tuples()).toEqual(otherUser.rankingsForMeeting(meeting).tuples());
            expect(meetingPage.rankedAgendaItems).toBeVisible();
            expect(meetingPage.agendaItemDetails).not.toHaveClass('active');
            expect(meetingPage.votes.selectedVoterId()).toEqual(otherUser.id());
            expect(meetingPage.rankedAgendaItemsHeader.text()).toBe(otherUser.fullName() + "'s Ranking");
            expect(meetingPage.backLink).toBeVisible();
          });
        });

        it("still enables sorting on the votes list and sets the correct header if the voter id matches the current user id", function() {
          stubAjax();
          meetingPage.params({ meetingId: meeting.id(), voterId: currentUser.id() });
          expect(meetingPage.rankedAgendaItems.sortingEnabled()).toBeTruthy();
          expect(meetingPage.rankedAgendaItemsHeader.text()).toBe('Your Ranking');
        });
      });

      describe("if the agendaItemId is specified", function() {
        describe("if the agendaItem exists", function() {
          it("assigns the selectedAgendaItem to the currentConsensus and agendaItemDetails, then fetches the agendaItems notes and assigns those later", function() {
            waitsFor("notes and noters to be fetched", function(complete) {
              meetingPage.params({ meetingId: meeting.id(), agendaItemId: agendaItem1.id() }).success(complete);

              expect(meetingPage.agendaItemDetails.loading()).toBeTruthy();

              expect(meetingPage.agendaItemDetails).toHaveClass('active');
              expect(meetingPage.currentConsensus.selectedAgendaItem()).toEqual(agendaItem1);
              expect(meetingPage.agendaItemDetails.agendaItem()).toEqual(agendaItem1);
              expect(meetingPage.votes.selectedVoterId()).toBeFalsy();

              expect(meetingPage.rankedAgendaItems.loading()).toBeFalsy();
              expect(meetingPage.notes.loading()).toBeFalsy();
              expect(meetingPage.votes.loading()).toBeFalsy();
            });

            runs(function() {
              expect(meetingPage.agendaItemDetails.loading()).toBeFalsy();

              expect(agendaItem1.notes().size()).toBeGreaterThan(0);
              expect(agendaItem1.noters().size()).toBe(agendaItem1.notes().size());
              expect(meetingPage.agendaItemDetails.notes.notes().tuples()).toEqual(agendaItem1.notes().tuples());
              expect(meetingPage.backLink).toBeVisible();
            });
          });
        });

        describe("if the agendaItem does NOT exist", function() {
          beforeEach(function() {
            spyOn(Application, 'showPage');
          });

          it("navigates to the current user's ranking", function() {
            waitsFor("fetch to complete", function(complete) {
              var nonExistentAgendaItemId = 102934;
              meetingPage.params({ meetingId: meeting.id(), agendaItemId: nonExistentAgendaItemId }).success(complete);
            });

            runs(function() {
              expect(Path.routes.current).toBe(meeting.url());
            });
          });
        });
      });
    });

    describe("when the current user subsequently changes", function() {
      describe("when displaying the current user's rankings", function() {
        beforeEach(function() {
          waitsFor("fetch to complete", function(complete) {
            meetingPage.params({ meetingId: meeting.id() }).success(complete);
          });
          runs(function() {
            expect(otherUser.rankings().size()).toBe(0);
          });
        });

        it("fetches the new user's rankings and displays them in the ranked agendaItems view", function() {
          waitsFor("new rankings to be fetched", function(complete) {
            Application.currentUser(otherUser).success(complete);
          });

          runs(function() {
            expect(otherUser.rankings().size()).toBeGreaterThan(0);
            expect(meetingPage.rankedAgendaItems.rankings().tuples()).toEqual(otherUser.rankings().tuples());
          });
        });
      });

      describe("when not displaying the current user's ranking", function() {
        it("fetches the new user's rankings for this meeting but does not change the view", function() {
          waitsFor("fetching of agendaItem data", function(complete) {
            meetingPage.params({ meetingId: meeting.id(), agendaItemId: agendaItem1.id()}).success(complete);
          });

          waitsFor("new rankings to be fetched", function(complete) {
            expect(meetingPage.agendaItemDetails).toHaveClass('active');
            Application.currentUser(otherUser).success(complete);
          });

          runs(function() {
            expect(otherUser.rankings().size()).toBeGreaterThan(0);
            expect(meetingPage.agendaItemDetails).toHaveClass('active'); // we don't change the view
          });
        });
      });
    });

    describe("when the params hash differs by the time the fetch completes", function() {
      it("does not populate data for the old params", function() {
        waitsFor("fetch to complete", function(complete) {
          meetingPage.params({ meetingId: meeting.id(), agendaItemId: agendaItem1.id() }).success(complete);
          stubAjax();
          meetingPage.params({ meetingId: 999 });
        });

        runs(function() {
          expect(meetingPage.agendaItemDetails.agendaItem()).not.toBeDefined();
        });
      });
    });
  });

  describe("local logic (no fetching)", function() {
    var currentUser, creator, team, meeting, agendaItem1, meeting2, editableByCurrentUser, mockedRandomString;

    beforeEach(function() {
      creator = User.createFromRemote({id: 1, firstName: "animal", lastName: "eater"});
      team = Team.createFromRemote({id: 1, name: "Neurotic designers", privacy: "public"});
      meeting = creator.meetings().createFromRemote({id: 1, body: "Untitled Meeting", createdAt: 91234, teamId: team.id(), startsAt: 12304897});
      agendaItem1 = meeting.agendaItems().createFromRemote({id: 1, body: "AgendaItem 1", position: 1, creatorId: creator.id(), createdAt: 2345});
      meeting2 = creator.meetings().createFromRemote({id: 2, body: "Retrospective", teamId: team.id(), createdAt: 91234, startsAt: 98027345});
      currentUser = team.makeMember({id: 1, firstName: "John", lastName: "Five"});
      Application.currentUser(currentUser);
      useFakeServer();

      editableByCurrentUser = true;
      spyOn(Meeting.prototype, 'editableByCurrentUser').andCallFake(function() {
        return editableByCurrentUser;
      });

      meetingPage.params({meetingId: meeting.id()});
      expect(Server.lastUpdate.record).toBe(team.membershipForCurrentUser());
      Server.lastUpdate.simulateSuccess();
      Server.lastFetch.simulateSuccess();
    });

    describe("when a meeting is assigned", function() {
      it("assigns the meeting's body, date, and notes relation, and keeps the body and the date up to date when they change", function() {
        expect(meetingPage.name.text()).toEqual(meeting.body());
        expect(meetingPage.startsAt.text()).toBe(meeting.formattedStartsAt());
        meeting.remotelyUpdated({body: "Let's talk about chips."});
        meeting.remotelyUpdated({startsAt: 9875});
        expect(meetingPage.name.text()).toEqual(meeting.body());
        expect(meetingPage.startsAt.text()).toEqual(meeting.formattedStartsAt());
        expect(meetingPage.notes.notes()).toBe(meeting.notes());

        meetingPage.meeting(meeting2);
        expect(meetingPage.name.text()).toEqual(meeting2.body());
        expect(meetingPage.startsAt.text()).toEqual(meeting2.formattedStartsAt());

        meeting.remotelyUpdated({body: "what would you do for a klondike bar?", details: "jhjyg"});
        meeting.remotelyUpdated({startsAt: 983745});
        expect(meetingPage.name.text()).toEqual(meeting2.body());
        expect(meetingPage.startsAt.text()).toEqual(meeting2.formattedStartsAt());
      });
    });

    describe("when the meeting is destroyed", function() {
      describe("when the meeting page is visible", function() {
        it("navigates back to the current team page", function() {
          spyOn(Application, 'showPage');
          meetingPage.meeting().remotelyDestroyed();
          expect(Path.routes.current).toBe(Application.currentTeam().url());
        });
      });

      describe("when the meeting page is not visible", function() {
        it("does not change the url", function() {
          meetingPage.hide();
          spyOn(Application, 'showPage');
          meetingPage.meeting().remotelyDestroyed();
          expect(Application.showPage).not.toHaveBeenCalled();
        });
      });
    });

    describe("when the 'suggest an agenda item' button is clicked", function() {
      it("navigates to the url for new agendaItems for the current meeting", function() {
        meetingPage.meeting(meeting);
        meetingPage.newAgendaItemLink.click();
        expect(Path.routes.current).toBe(meeting.url() + "/agenda_items/new");
      });
    });

    describe("when the 'back to meetings' link is clicked", function() {
      it("navigates to the meeting's team page", function() {
        spyOn(Application, 'showPage');
        meetingPage.teamLink.click();
        expect(Path.routes.current).toBe(team.url());
      });
    });

    describe("showing and hiding of agendaItem details based on clicking on different elements of the page", function() {
      var agendaItem1Li, agendaItem2Li;

      beforeEach(function() {
        meeting.agendaItems().createFromRemote({id: 2, body: "AgendaItem 2", position: 2, creatorId: creator.id(), createdAt: 2345});
        agendaItem1Li = meetingPage.find('li.agenda-item:contains("AgendaItem 1")');
        agendaItem2Li = meetingPage.find('li.agenda-item:contains("AgendaItem 2")');
        expect(agendaItem1Li).toExist();
        expect(agendaItem2Li).toExist();
      });

      describe("when clicking outside of the agendaItems", function() {
        it("navigates back to the base meeting url to hide any currently displayed ranking / agendaItem details", function() {
          spyOn(History, 'replaceState');
          var selectionString = "";
          spyOn(window, 'getSelection').andReturn({ toString: function() { return selectionString }});

          meetingPage.click();
          expect(History.replaceState).toHaveBeenCalledWith(null, null, meeting.url());
          History.replaceState.reset();

          agendaItem1Li.click();
          expect(History.replaceState).not.toHaveBeenCalledWith(null, null, meeting.url());
          History.replaceState.reset();

          agendaItem2Li.click();
          expect(History.replaceState).not.toHaveBeenCalledWith(null, null, meeting.url());
          History.replaceState.reset();

          agendaItem1Li.children().click();
          expect(History.replaceState).not.toHaveBeenCalledWith(null, null, meeting.url());
          History.replaceState.reset();

          meetingPage.agendaItemDetails.click();
          expect(History.replaceState).not.toHaveBeenCalled();

          meetingPage.agendaItemDetails.find(':not(.close,.destroy,.more,.less)').click();
          expect(History.replaceState).not.toHaveBeenCalledWith(null, null, meeting.url());
          History.replaceState.reset();

          // does not navigate when selecting text
          selectionString = "foooo";
          meetingPage.click();
          expect(History.replaceState).not.toHaveBeenCalled();
        });
      });

      describe("when clicking on a selected agendaItem a second time", function() {
        it("navigates back to the base meeting url to hide the agendaItem details", function() {
          agendaItem1Li.click();

          spyOn(History, 'replaceState');
          agendaItem1Li.click();
          expect(History.replaceState).toHaveBeenCalledWith(null, null, meeting.url());
        });
      });
    });

    describe("when the back link is clicked", function() {
      it("navigates to the meeting's url", function() {
        spyOn(History, 'replaceState');
        meetingPage.backLink.click();

        expect(History.replaceState).toHaveBeenCalledWith(null,null,meeting.url());
      });
    });
  });

  describe("mixpanel tracking", function() {
    var creator, meeting;

    beforeEach(function() {
      creator = User.createFromRemote({id: 1});
      meeting = creator.meetings().createFromRemote({id: 1, body: "What's the best kind of mate?", createdAt: 1234, teamId: 1});
    });

    describe("when the meeting changes", function() {
      it("pushes a 'view meeting' event to the mixpanel queue", function() {
        meetingPage.meeting(meeting);
        expect(mpq.length).toBe(1);
        var event = mpq.pop();
        expect(event[0]).toBe('track');
        expect(event[1]).toBe('View Meeting');
      });
    });
  });
});
