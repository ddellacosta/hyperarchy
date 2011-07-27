//= require spec/spec_helper

describe("Views.Pages.Team.QuestionLi", function() {
  var questionLi, creator, question, agendaItem1, agendaItem2, agendaItem1Li, agendaItem2Li;
  beforeEach(function() {
    attachLayout();
    creator = User.createFromRemote({id: 1, emailHash: "email-hash"});
    question = Question.createFromRemote({id: 1, body: "What's your *favorite* color?", creatorId: creator.id()});
    agendaItem1 = question.agendaItems().createFromRemote({id: 1, body: "*Red*", position: 1});
    agendaItem2 = question.agendaItems().createFromRemote({id: 2, body: "Blue", position: 2});
    questionLi = Views.Pages.Team.QuestionLi.toView({question: question});
    agendaItem1Li = questionLi.find('li:contains("Red")').view();
    agendaItem2Li = questionLi.find('li:contains("Blue")').view();
  });

  describe("#initialize", function() {
    it("assigns the body, agendaItems, agendaItem positions, and creator avatar", function() {
      expect(questionLi.avatar.user()).toBe(creator);
      expect(questionLi.body.html()).toBe($.markdown(question.body()));
      expect(questionLi.agendaItems.relation().tuples()).toEqual(question.agendaItems().tuples());
      expect(agendaItem1Li.position.text()).toBe('1');
      expect(agendaItem1Li.body.html()).toBe($.markdown(agendaItem1.body()));
      expect(agendaItem2Li.position.text()).toBe('2');
      expect(agendaItem2Li.body.html()).toBe($.markdown(agendaItem2.body()));
    });
  });

  describe("when the position of agendaItems change", function() {
    it("updates the position number on the agendaItem li", function() {
      expect(agendaItem1Li.position.text()).toBe('1');
      expect(agendaItem2Li.position.text()).toBe('2');

      agendaItem1.remotelyUpdated({position: 2});
      agendaItem2.remotelyUpdated({position: 1});

      expect(agendaItem2Li.position.text()).toBe('1');
      expect(agendaItem1Li.position.text()).toBe('2');
    });
  });

  describe("when the bodies of agendaItems change", function() {
    it("updates the body on the agendaItem li", function() {
      agendaItem1.remotelyUpdated({body: "**Black**"});
      expect(agendaItem1Li.body.html()).toBe($.markdown(agendaItem1.body()));
    });
  });
});
