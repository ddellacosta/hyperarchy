//= require spec/spec_helper

describe("AgendaItem", function() {
  describe("#editableByCurrentUser()", function() {
    var team, agendaItem, admin, owner, creator, otherUser, team;
    beforeEach(function() {
      team = Team.createFromRemote({id: 1});
      var meeting = team.meetings().createFromRemote({id: 1});
      owner = User.createFromRemote({id: 1});
      team.memberships().createFromRemote({userId: owner.id(), role: 'owner'});
      admin = User.createFromRemote({id: 2, admin: true});
      otherUser = User.createFromRemote({id: 3});
      creator = User.createFromRemote({id: 4});
      agendaItem = meeting.agendaItems().createFromRemote({id: 1, creatorId: creator.id()});

      attachLayout();
    });

    it("returns true only if the current user is an admin, an owner of the agendaItem's team, or the creator of the agendaItem", function() {
      Application.currentUser(admin);
      expect(agendaItem.editableByCurrentUser()).toBeTruthy();

      Application.currentUser(owner);
      expect(agendaItem.editableByCurrentUser()).toBeTruthy();

      Application.currentUser(creator);
      expect(agendaItem.editableByCurrentUser()).toBeTruthy();

      Application.currentUser(otherUser);
      expect(agendaItem.editableByCurrentUser()).toBeFalsy();
    });
  });

  describe("#afterRemoteDestroy", function() {
    it("destroys any associated rankings locally, because that would have happened on the server but we may not have heard about it yet", function() {
      var agendaItem = AgendaItem.createFromRemote({id: 1});
      agendaItem.rankings().createFromRemote({id: 1});
      agendaItem.rankings().createFromRemote({id: 2});
      var ranking3 = Ranking.createFromRemote({id: 3, agendaItemId: 99});

      agendaItem.remotelyDestroyed();

      expect(Ranking.find(1)).toBeUndefined();
      expect(Ranking.find(2)).toBeUndefined();
      expect(Ranking.find(3)).toBe(ranking3);
    });
  });

  describe("#url", function() {
    it("returns the correct url", function() {
      expect(AgendaItem.createFromRemote({id: 11, meetingId: 22, body: "Fruitloops"}).url()).toEqual('/meetings/22/agenda_items/11');
    });
  });
});
