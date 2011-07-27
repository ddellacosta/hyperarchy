//= require spec/spec_helper

describe("Views.Pages.Question.Notes", function() {
  var member, question, note1, note2, creator1, creator2, notesRelation, notesView, longNoteBody;

  beforeEach(function() {
    attachLayout();
    member = User.createFromRemote({id: 1});
    Application.currentUser(member);

    question = Question.createFromRemote({id: 22, creatorId: 1, createdAt: 234});
    creator1 = User.createFromRemote({id: 1, firstName: "Noteo", lastName: "Santiago"});
    creator2 = User.createFromRemote({id: 2, firstName: "Kommentor", lastName: "Brunsfeld"});
    note1 = question.notes().createFromRemote({id: 11, body: "I likeah the fruiloops so much", creatorId: creator1.id(), createdAt: 3245});
    note2 = question.notes().createFromRemote({id: 12, body: "Yez but sie koko krispies sind sehr yummy", creatorId: creator2.id(), createdAt: 3295});

    spyOn(QuestionNote.prototype, 'editableByCurrentUser').andReturn(true);

    notesView = Views.Pages.Question.Notes.toView();
    notesRelation = question.notes();

    $('#jasmine_content').html(notesView);
    notesView.width(800);
    notesView.height(300);
    notesView.attach();
    notesView.notes(notesRelation);

    longNoteBody = ""
    for (var i = 0; i < 20; i++) {
      longNoteBody += "Coocoo for cocoa puffs!!! Coocoo!! Ahh!! "
    }
  });

  describe("when the notes relation is assigned", function() {
    it("assigns the relation on its list", function() {
      expect(notesView.list.relation().tuples()).toEqual(notesRelation.tuples());
    });
  });

  describe("note creation", function() {
    beforeEach(function() {
      useFakeServer();
    });

    describe("when the current user is a member", function() {
      describe("when the create note button is clicked", function() {
        it("clears and resizes the textarea, scrolls list to bottom, and submits a note to the server", function() {
          var originalTextareaHeight = notesView.textarea.height();

          notesView.textarea.val(longNoteBody);
          notesView.textarea.keyup(); // trigger elastic
          expect(notesView.textarea.height()).toBeGreaterThan(originalTextareaHeight);


          notesView.createButton.click();
          expect(notesView.textarea.val()).toBe('');
          expect(notesView.textarea.height()).toBe(originalTextareaHeight);

          expect(Server.creates.length).toBe(1);

          var createdRecord = Server.lastCreate.record;

          expect(createdRecord.body()).toBe(longNoteBody);
          expect(createdRecord.questionId()).toBe(question.id());
        });
      });

      describe("when enter is pressed within the note", function() {
        it("clears the textarea and submits a note to the server", function() {
          notesView.textarea.val("I like to eat stamps!");
          notesView.textarea.trigger({ type : 'keydown', which : 13 });
          expect(notesView.textarea.val()).toBe('');
          expect(Server.creates.length).toBe(1);

          var createdRecord = Server.lastCreate.record;

          expect(createdRecord.body()).toBe("I like to eat stamps!");
          expect(createdRecord.questionId()).toBe(question.id());
        });

        it("does nothing if the textarea is blank", function() {
          notesView.textarea.val("   ");
          notesView.textarea.trigger({ type : 'keydown', which : 13 });
          expect(Server.creates).toBeEmpty();
        });
      });
    });

    describe("when the current user is a guest", function() {
      var guest;
      beforeEach(function() {
        guest = User.createFromRemote({id: 2, guest: true});
        Application.currentUser(guest);
        notesView.detach();
        $('#jasmine_content').html(Application);
      });

      describe("when the user signs up / logs in at the prompt", function() {
        it("creates the note and clears the field", function() {
          notesView.textarea.val("I like to eat stamps!");
          notesView.textarea.trigger({ type : 'keydown', which : 13 });

          expect(Server.creates.length).toBe(0);
          expect(Application.signupForm).toBeVisible();
          Application.signupForm.firstName.val("Dude");
          Application.signupForm.lastName.val("Richardson");
          Application.signupForm.emailAddress.val("dude@example.com");
          Application.signupForm.password.val("wicked");
          Application.signupForm.form.submit();
          expect($.ajax).toHaveBeenCalled();

          $.ajax.mostRecentCall.args[0].success({ current_user_id: member.id() });

          expect(notesView.textarea.val()).toBe('');
          expect(Server.creates.length).toBe(1);
          var createdRecord = Server.lastCreate.record;
          expect(createdRecord.body()).toBe("I like to eat stamps!");
          expect(createdRecord.questionId()).toBe(question.id());
        });
      });

      describe("when the user cancels at the prompt", function() {
        it("does not create the note or clear out the field", function() {
          notesView.textarea.val("I like to eat stamps!");
          notesView.textarea.trigger({ type : 'keydown', which : 13 });

          expect(Server.creates.length).toBe(0);
          expect(Application.signupForm).toBeVisible();
          Application.signupForm.close();

          expect(Server.creates.length).toBe(0);
          expect(notesView.textarea.val()).toBe("I like to eat stamps!");
        });
      });
    });
  });

  describe("auto-scrolling", function() {
    beforeEach(function() {
      _.times(20, function(i) {
        notesRelation.createFromRemote({id: 100 + i, body: "This is a note to make the thing overflow", creatorId: creator1.id(), createdAt: 12345});
      });
    });

    describe("when the user has not scrolled the notes list", function() {
      describe("when a note is inserted/destroyed by anyone", function() {
        it("auto-scrolls to the end of the list", function() {
          var longNote = notesRelation.createFromRemote({id: 13, body: longNoteBody, creatorId: creator1.id(), createdAt: 2345234})
          expectListScrolledToBottom();
          longNote.remotelyDestroyed();
          expectListScrolledToBottom();
        });
      });

      describe("when the height is changed", function() {
        it("auto-scrolls to the end of the list", function() {
          notesView.height(600);
          expectListScrolledToBottom();

          notesView.height(300);
          expectListScrolledToBottom();
        });
      });
    });

    describe("when the user has scrolled the notes list up intentionally", function() {
      var initialScrollTop;
      beforeEach(function() {
        initialScrollTop = notesView.list.scrollTop() - 200;
        notesView.list.scrollTop(initialScrollTop);
        notesView.list.trigger('scroll');
      });

      describe("when a note is inserted", function() {
        it("does not change the scroll position", function() {
          notesRelation.createFromRemote({id: 200, body: "Another note", creatorId: creator1.id(), createdAt: 12345});
          expect(notesView.list.scrollTop()).toBe(initialScrollTop);
        });
      });

      describe("when the height is changed", function() {
        it("does not change the scroll position", function() {
          notesView.height(400);
          expectListNotScrolledToBottom();
          notesView.height(300);
          expectListNotScrolledToBottom();
        });
      });

      describe("when a note is submitted", function() {
        it("scrolls back to the bottom and re-enables autoscroll", function() {
          useFakeServer();

          notesView.textarea.val("We are liiiving, in a material world");
          notesView.createButton.click();

          expectListScrolledToBottom();

          Server.lastCreate.simulateSuccess({creatorId: creator1.id(), createdAt: 12345});

          expectListScrolledToBottom();
        });
      });
    });

    describe("when the user previously scrolled up, but then scrolled back to the bottom", function() {
      beforeEach(function() {
        var list = notesView.list;
        initialScrollTop = list.scrollTop() - 200;
        list.scrollTop(initialScrollTop);
        list.trigger('scroll');
        notesView.scrollToBottom();
        list.trigger('scroll');
      });

      describe("when a note is inserted/destroyed by anyone", function() {
        it("auto-scrolls to the end of the list", function() {
          var longNote = notesRelation.createFromRemote({id: 13, body: longNoteBody, creatorId: creator1.id(), createdAt: 2345234})
          expectListScrolledToBottom();
          longNote.remotelyDestroyed();
          expectListScrolledToBottom();
        });
      });

      describe("when the height is changed", function() {
        it("auto-scrolls to the end of the list", function() {
          notesView.height(600);
          expectListScrolledToBottom();

          notesView.height(300);
          expectListScrolledToBottom();
        });
      });
    });

    function expectListScrolledToBottom() {
      var list = notesView.list;
      expect(list.attr('scrollTop') + list.height()).toBe(list.attr('scrollHeight'));
    }

    function expectListNotScrolledToBottom() {
      var list = notesView.list;
      expect(list.attr('scrollTop') + list.height()).toBeLessThan(list.attr('scrollHeight'));
    }
  });

  describe("when the textarea resizes", function() {
    it("adjusts the height of the list so it does not push the textarea beyond the height of the notes div", function() {
      var longNote = notesRelation.createFromRemote({id: 13, body: longNoteBody, creatorId: creator1.id(), createdAt: 2345234})

      notesView.textarea.val(longNoteBody);
      notesView.textarea.keyup();

      var list = notesView.list;
      var listBottom = list.position().top + list.height();
      expect(listBottom).toBeLessThan(notesView.textareaAndButton.position().top);
    });
  });

  describe("loading", function() {
    it("hides the view if loading, shows it otherwise", function() {
      expect(notesView).toBeVisible();
      notesView.loading(true);
      expect(notesView).toBeHidden();

      notesView.loading(false);
      expect(notesView).toBeVisible();
    });
  });
  
  describe("#expanded(true/false)", function() {
    it("adjusts css properties to auto-expand when in expanded mode or remain contain when collapsed", function() {
      expect(notesView.expanded()).toBeFalsy();
      notesView.height(150);

      // when expanded, no longer contains itself in previously assigned height
      notesView.expanded(true);
      expect(notesView.height()).toBeGreaterThan(150);
      expect(notesView.list.css('max-height')).toBe('none');

      notesView.expanded(false);
      expect(notesView.list.css('max-height')).not.toBe('none'); // resize the list to fit
    });
  });
  
  describe("mixpanel tracking", function() {
    beforeEach(function() {
      useFakeServer();
      Application.currentUser(creator1);
      mpq = [];
    });

    describe("when a note is created", function() {
      it("pushes a 'create note' event to the mixpanel queue", function() {
        notesView.textarea.val("wicked data, bro.");
        notesView.createButton.click();
        spyOn(Server.lastCreate.record, 'creator').andReturn(creator1);
        spyOn(Server.lastCreate.record, 'createdAt').andReturn(new Date());

        Server.lastCreate.simulateSuccess();

        expect(mpq.length).toBe(1);
        var event = mpq.pop();
        expect(event[0]).toBe('track');
        expect(event[1]).toContain('Create');
        expect(event[1]).toContain('Note');
      });
    });
  });
});
