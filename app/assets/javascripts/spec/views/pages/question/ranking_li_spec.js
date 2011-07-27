//= require spec/spec_helper

describe("Views.Pages.Question.RankingLi", function() {
  var agendaItem, ranking, rankedAgendaItemLi;

  beforeEach(function() {
    attachLayout();
    agendaItem = AgendaItem.createFromRemote({id: 11, questionId: 22, body: "Fruitloops"});
    ranking = Ranking.createFromRemote({agendaItemId: agendaItem.id()});
  });

  describe("initialize", function() {
    it("assigns itself the agendaItem for the given ranking", function() {
      rankedAgendaItemLi = Views.Pages.Question.RankingLi.toView({ranking: ranking});
      expect(rankedAgendaItemLi.agendaItem).toEqual(agendaItem);
    });
  });
});