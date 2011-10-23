//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

describe("Views.Pages.Question.AnswerLi", function() {
  var question, answer, answerLi;

  beforeEach(function() {
    attachLayout();
    Application.currentUser(User.created({id: 1}));

    question = Question.created({id: 22, creatorId: 1, createdAt: 234});
    answer = question.answers().created({id: 11, body: "Fruitloops"});
    answerLi = Views.Pages.Question.AnswerLi.toView({answer: answer});
  });

  describe("when clicked", function() {
    it("navigates to the answer's url", function() {
      spyOn(Application, 'showPage');
      answerLi.click();
      expect(Path.routes.current).toBe(answer.url());
    });
    
    describe("when in fullscreen mode", function() {
      it("navigates to the answer's full screen url", function() {
        spyOn(Application, 'showPage');
        answerLi = Views.Pages.Question.AnswerLi.toView({answer: answer, fullScreen: true});
        answerLi.click();
        expect(Path.routes.current).toBe(answer.fullScreenUrl());
      });
    });
  });

  describe("#handleDragStart (having trouble simulating it getting called without triggering the click handler)", function() {
    it("navigates to the question's bare url to cause the user's rankings to be revealed", function() {
      spyOn(Application, 'showPage');
      answerLi.handleDragStart();
      expect(Path.routes.current).toBe(question.url());
    });
  });
});
