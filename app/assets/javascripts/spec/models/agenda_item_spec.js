//= require spec/spec_helper

describe("AgendaItem", function() {
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
