//= require spec/spec_helper

describe("Views.Pages.Meeting.CurrentConsensus", function() {
  var currentConsensusView, meeting, agendaItem1, agendaItem2, user1;

  beforeEach(function() {
    attachLayout();
    currentConsensusView = Application.meetingPage.currentConsensus;
    $('#jasmine_content').append(currentConsensusView);

    meeting = Meeting.createFromRemote({id: 1});
    agendaItem1 = meeting.agendaItems().createFromRemote({id: 1, body: "Cheese", position: 1});
    agendaItem2 = meeting.agendaItems().createFromRemote({id: 2, body: "Goats", position: 2});

    user1 = User.createFromRemote({id: 1});
    Application.currentUser(user1);
  });


  describe("with the agendaItems relation assigned", function() {
    beforeEach(function() {
      currentConsensusView.agendaItems(meeting.agendaItems());
    });

    describe("when the selectedAgendaItem is changed", function() {
      it("adds the .selected class on the selected agendaItem's li and removes it from any others", function() {
        currentConsensusView.selectedAgendaItem(agendaItem1);
        expect(currentConsensusView).toContain('li.selected:contains("' + agendaItem1.body() + '")');

        currentConsensusView.selectedAgendaItem(agendaItem2);

        expect(currentConsensusView).toContain('li.selected:contains("' + agendaItem2.body() + '")');
        expect(currentConsensusView).not.toContain('li.selected:contains("' + agendaItem1.body() + '")');

        currentConsensusView.selectedAgendaItem(null);
        expect(currentConsensusView).not.toContain('li.selected');
      });
    });

    describe("when the position of a agendaItem changes", function() {
      it("updates the position on the agendaItem li", function() {
        var agendaItem1Li = currentConsensusView.find('li:contains("' + agendaItem1.body() + '")').view();
        var agendaItem2Li = currentConsensusView.find('li:contains("' + agendaItem2.body() + '")').view();

        expect(agendaItem1Li.position.text()).toBe("1");
        expect(agendaItem2Li.position.text()).toBe("2");

        agendaItem1.remotelyUpdated({position: 2});
        agendaItem2.remotelyUpdated({position: 1});

        expect(agendaItem1Li.position.text()).toBe("2");
        expect(agendaItem2Li.position.text()).toBe("1");
      });
    });

    describe("when the body of a agendaItem changes", function()  {
      it("updates the body in the agendaItem li", function() {
        var agendaItem1Li = currentConsensusView.find('li:contains("' + agendaItem1.body() + '")').view();

        expect(agendaItem1Li.body.html()).toBe($.markdown(agendaItem1.body()));

        agendaItem1.remotelyUpdated({body: 'rockets!'});

        expect(agendaItem1Li.body.html()).toBe($.markdown(agendaItem1.body()));
      });
    });
  });

  describe("icons", function() {
    var user2, agendaItem3, agendaItem1Li, agendaItem2Li, agendaItem3Li;

    beforeEach(function() {
      agendaItem3 = meeting.agendaItems().createFromRemote({id: 3, body: "Deer", position: 3});
      user2 = User.createFromRemote({id: 2});
      user1.rankingsForMeeting(meeting).createFromRemote({agendaItemId: agendaItem1.id(), position: 64});
      user1.rankingsForMeeting(meeting).createFromRemote({agendaItemId: agendaItem2.id(), position: -64});
      user2.rankingsForMeeting(meeting).createFromRemote({agendaItemId: agendaItem2.id(), position: 64});
      user2.rankingsForMeeting(meeting).createFromRemote({agendaItemId: agendaItem3.id(), position: -64});

      agendaItem1.remotelyUpdated({noteCount: 1});
      agendaItem2.remotelyUpdated({details: "Arcata's full of nimby cryers"});

      currentConsensusView.agendaItems(meeting.agendaItems());
      agendaItem1Li = currentConsensusView.list.elementForRecord(agendaItem1);
      agendaItem2Li = currentConsensusView.list.elementForRecord(agendaItem2);
      agendaItem3Li = currentConsensusView.list.elementForRecord(agendaItem3);
    });

    describe("ranking status of the agendaItem lis", function() {
      describe("when the agendaItems relation is assigned", function() {
        it("assigns the ranking statuses of the agendaItems to reflect the new user's rankings", function() {
          expect(agendaItem1Li.status).toHaveClass('positive');
          expect(agendaItem1Li.status).not.toHaveClass('negative');
          expect(agendaItem2Li.status).not.toHaveClass('positive');
          expect(agendaItem2Li.status).toHaveClass('negative');
          expect(agendaItem3Li.status).not.toHaveClass('positive');
          expect(agendaItem3Li.status).not.toHaveClass('negative');
        });
      });

      describe("when the current user changes", function() {
        it("updates the ranking statuses of the agendaItems to reflect the new user's rankings", function() {
          Application.currentUser(user2);

          expect(agendaItem1Li.status).not.toHaveClass('positive');
          expect(agendaItem1Li.status).not.toHaveClass('negative');
          expect(agendaItem2Li.status).toHaveClass('positive');
          expect(agendaItem2Li.status).not.toHaveClass('negative');
          expect(agendaItem3Li.status).not.toHaveClass('positive');
          expect(agendaItem3Li.status).toHaveClass('negative');
        });

        it("listens for updates to the new user's rankings", function() {
          Application.currentUser(user2);

          user2.rankings().createFromRemote({agendaItemId: agendaItem1.id(), position: -128});
          user2.rankings().find({agendaItemId: agendaItem2.id()}).remotelyDestroyed();
          user2.rankings().find({agendaItemId: agendaItem3.id()}).remotelyUpdated({position: 128});

          expect(agendaItem1Li.status).not.toHaveClass('positive');
          expect(agendaItem1Li.status).toHaveClass('negative');
          expect(agendaItem2Li.status).not.toHaveClass('positive');
          expect(agendaItem2Li.status).not.toHaveClass('negative');
          expect(agendaItem3Li.status).toHaveClass('positive');
          expect(agendaItem3Li.status).not.toHaveClass('negative');
        });
      });

      describe("when the current user creates, updates or destroys rankings for these agendaItems", function() {
        it("updates the ranking statuses of the agendaItems to reflect the new user's rankings", function() {
          user1.rankings().find({agendaItemId: agendaItem1.id()}).remotelyUpdated({position: -128});
          user1.rankings().find({agendaItemId: agendaItem2.id()}).remotelyDestroyed();
          user1.rankings().createFromRemote({agendaItemId: agendaItem3.id(), position: 128});

          expect(agendaItem1Li.status).not.toHaveClass('positive');
          expect(agendaItem1Li.status).toHaveClass('negative');
          expect(agendaItem2Li.status).not.toHaveClass('positive');
          expect(agendaItem2Li.status).not.toHaveClass('negative');
          expect(agendaItem3Li.status).toHaveClass('positive');
          expect(agendaItem3Li.status).not.toHaveClass('negative');
        });
      });

      describe("when a ranking is destroyed *AFTER* its agendaItem is destroyed", function() {
        it("does not raise an exception trying to access the missing agendaItem", function() {
          var ranking = user1.rankings().first();
          ranking.agendaItem().remotelyDestroyed();
          ranking.remotelyDestroyed();
        });
      });
    });

    describe("showing and hiding of the ellipsis", function() {
      describe("when the agendaItems relation is assigned", function() {
        it("shows the ellipsis for only those agendaItems that have details or notes", function() {
          expect(agendaItem1Li.ellipsis).toBeVisible();
          expect(agendaItem2Li.ellipsis).toBeVisible();
          expect(agendaItem3Li.ellipsis).not.toBeVisible();
        });
      });

      describe("when agendaItems' details are updated", function() {
        it("shows the ellipsis for only those agendaItems that have details or notes", function() {
          agendaItem2.remotelyUpdated({details: ""});
          agendaItem3.remotelyUpdated({details: "Deer always die in car accidents."});

          expect(agendaItem1Li.ellipsis).toBeVisible();
          expect(agendaItem2Li.ellipsis).not.toBeVisible();
          expect(agendaItem3Li.ellipsis).toBeVisible();
        });
      });

      describe("when agendaItem notes are created or removed", function() {
        it("shows the ellipsis for only those agendaItems that have details or notes", function() {
          agendaItem1.remotelyUpdated({noteCount: 0});
          agendaItem3.remotelyUpdated({noteCount: 1});

          expect(agendaItem1Li.ellipsis).not.toBeVisible();
          expect(agendaItem2Li.ellipsis).toBeVisible();
          expect(agendaItem3Li.ellipsis).toBeVisible();
        });
      });
    });
  });
});
