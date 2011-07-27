//= require spec/spec_helper

describe("Views.Pages.Question.AgendaItemDetails", function() {
  var agendaItemDetails, agendaItem, creator, question, organization;

  beforeEach(function() {
    renderLayout();
    Application.height(1000);

    agendaItemDetails = Application.questionPage.agendaItemDetails;
    organization = Organization.createFromRemote({id: 42});
    creator = organization.makeMember({id: 999, emailHash: 'blas', firstName: "Mr.", lastName: "Creator"});
    Application.currentUser(creator);
    question = organization.questions().createFromRemote({id: 1, creatorId: 999, createdAt: 12});
    agendaItem = creator.agendaItems().createFromRemote({id: 1, questionId: 1, body: "Mustard.", details: "Pardon me. Do you have any Gray Poupon?", createdAt: 1308352736162});

    Application.questionPage.show();
    Application.questionPage.showAgendaItemDetails();

    agendaItemDetails.agendaItem(agendaItem);
  });

  describe("when the agendaItem is assigned", function() {
    it("populates the body, details, and avatar", function() {
      expect(agendaItemDetails.body.html()).toEqual($.markdown(agendaItem.body()));
      expect(agendaItemDetails.details.html()).toEqual($.markdown(agendaItem.details()));
      agendaItem.remotelyUpdated({body: "Catsup", details: "37 flavors"});
      expect(agendaItemDetails.body.html()).toEqual($.markdown(agendaItem.body()));
      expect(agendaItemDetails.details.html()).toEqual($.markdown(agendaItem.details()));
      expect(agendaItemDetails.avatar.user()).toBe(agendaItem.creator());
      expect(agendaItemDetails.creatorName.text()).toBe(creator.fullName());
      expect(agendaItemDetails.createdAt.text()).toBe(agendaItem.formattedCreatedAt());
    });

    it("removes subscriptions to the previous agendaItem", function() {
      var agendaItem2 = AgendaItem.createFromRemote({id: 57, body: "soup.", questionId: question.id(), createdAt: 1111, creatorId: creator.id()});
      var subscriptionsBefore = agendaItem.onDestroyNode.size();

      agendaItemDetails.agendaItem(agendaItem2);

      expect(agendaItem.onDestroyNode.size()).toBe(subscriptionsBefore - 1);

      spyOn(History, 'pushState');
      agendaItem.remotelyDestroyed();
      expect(History.pushState).not.toHaveBeenCalled();
    });

    it("hides the form if it is showing, even if the agendaItem does not change", function() {
      agendaItemDetails.agendaItem(agendaItem);

      agendaItemDetails.editButton.click();

      expect(agendaItemDetails.form).toBeVisible();
      expect(agendaItemDetails.nonEditableContent).toBeHidden();

      agendaItemDetails.agendaItem(agendaItem);

      expect(agendaItemDetails.form).toBeHidden();
      expect(agendaItemDetails.nonEditableContent).toBeVisible();
    });

    it("handles null agendaItems", function() {
      agendaItemDetails.agendaItem(null);
    });
  });

  describe("showing and hiding of the edit and destroy buttons", function() {
    var currentUserCanEdit;
    beforeEach(function() {
      spyOn(AgendaItem.prototype, 'editableByCurrentUser').andCallFake(function() {
        return currentUserCanEdit;
      });
    });

    describe("on agendaItem assignment", function() {
      it("shows the edit link only if the current user can edit", function() {
        var otherAgendaItem = question.agendaItems().createFromRemote({id: 100, creatorId: creator.id(), createdAt: 234234});

        currentUserCanEdit = false;
        agendaItemDetails.agendaItem(otherAgendaItem);
        expect(agendaItemDetails).not.toHaveClass('mutable');
        expect(agendaItemDetails.editButton).toBeHidden();
        expect(agendaItemDetails.destroyButton).toBeHidden();


        currentUserCanEdit = true;
        agendaItemDetails.agendaItem(agendaItem);
        expect(agendaItemDetails).toHaveClass('mutable');
        expect(agendaItemDetails.editButton).toBeVisible();
        expect(agendaItemDetails.destroyButton).toBeVisible();
      });
    });

    describe("on user switch", function() {
      it("shows the edit button only when the current user is the creator of the agendaItem, an owner of the organization, or an admin", function() {
        var otherUser = User.createFromRemote({id: 123});

        currentUserCanEdit = false;
        Application.currentUser(otherUser);
        expect(agendaItemDetails.editButton).toBeHidden();
        expect(agendaItemDetails.destroyButton).toBeHidden();

        currentUserCanEdit = true;
        Application.currentUser(creator);
        expect(agendaItemDetails.editButton).toBeVisible();
        expect(agendaItemDetails.destroyButton).toBeVisible();
      });
    });
  });

  describe("handling of long details", function() {
    var longDetails = "It is ", longAgendaItem;

    beforeEach(function() {
      _.times(100, function() { longDetails += "so " });
      longDetails += "good.";
      longAgendaItem = creator.agendaItems().createFromRemote({id: 1, questionId: 1, body: "Sourkraut", details: longDetails, createdAt: 1308352736162});
    });

    describe("when an agendaItem is assigned or updated", function() {
      it("truncates the details and shows and hides the expand button as appropriate", function() {
        expect(agendaItemDetails.expandedDetails).toBeHidden();
        expect(agendaItemDetails.details).toBeVisible();

        // assign agendaItem w/ long details
        agendaItemDetails.agendaItem(longAgendaItem);

        expect(agendaItemDetails.moreLink).toBeVisible();
        expect(agendaItemDetails.details.text()).toContain(longAgendaItem.details().substring(0, 100));
        expect(agendaItemDetails.details.text()).toContain("…");

        // update agendaItem w/ short details
        longAgendaItem.remotelyUpdated({details: "I like it."});

        expect(agendaItemDetails.moreLink).toBeHidden();
        expect(agendaItemDetails.details.text()).toContain(longAgendaItem.details());
        expect(agendaItemDetails.details.text()).not.toContain("…");

        // update agendaItem w/ long details
        longDetails = "I just ";
        _.times(100, function() { longDetails += "really " });
        longDetails += "love it.";
        longAgendaItem.remotelyUpdated({details: longDetails});

        expect(agendaItemDetails.moreLink).toBeVisible();
        expect(agendaItemDetails.details.text()).toContain(longAgendaItem.details().substring(0, 100));
        expect(agendaItemDetails.details.text()).toContain("…");

        // assign agendaItem w/ short details
        agendaItemDetails.agendaItem(agendaItem);

        expect(agendaItemDetails.moreLink).toBeHidden();
        expect(agendaItemDetails.details.text()).toContain(agendaItem.details());
        expect(agendaItemDetails.details.text()).not.toContain("…");
      });

      it("exits expanded mode when a different agendaItem is assigned", function() {
        agendaItemDetails.agendaItem(agendaItem);
        agendaItemDetails.moreLink.click();

        agendaItemDetails.agendaItem(longAgendaItem);

        expect(agendaItemDetails.details).toBeVisible();
        expect(agendaItemDetails.moreLink).toBeVisible();
        expect(agendaItemDetails.expandedDetails).toBeHidden();
        expect(agendaItemDetails.lessLink).toBeHidden();
        expect(agendaItemDetails).not.toHaveClass('expanded');
      });
    });
    
    describe("when the 'more' and 'less' buttons are clicked", function() {
      it("switches between the expanded and non-expanded details, and shows and hides the 'more' and 'less' buttons as appropriate", function() {
        agendaItemDetails.agendaItem(longAgendaItem);

        expect(agendaItemDetails.details).toBeVisible();
        expect(agendaItemDetails.moreLink).toBeVisible();
        expect(agendaItemDetails.expandedDetails).toBeHidden();
        expect(agendaItemDetails.lessLink).toBeHidden();

        agendaItemDetails.moreLink.click();

        expect(agendaItemDetails.details).toBeHidden();
        expect(agendaItemDetails.moreLink).toBeHidden();
        expect(agendaItemDetails.expandedDetails).toBeVisible();
        expect(agendaItemDetails.lessLink).toBeVisible();
        expect(agendaItemDetails).toHaveClass('expanded');

        agendaItemDetails.lessLink.click();

        expect(agendaItemDetails.details).toBeVisible();
        expect(agendaItemDetails.moreLink).toBeVisible();
        expect(agendaItemDetails.expandedDetails).toBeHidden();
        expect(agendaItemDetails.lessLink).toBeHidden();
        expect(agendaItemDetails).not.toHaveClass('expanded');

        // when you contract after the agendaItem gets shorter in background while expanded, the expand button is hidden
        agendaItemDetails.moreLink.click();
        longAgendaItem.remotelyUpdated({details: "I like it."});
        agendaItemDetails.lessLink.click();
        expect(agendaItemDetails.moreLink).toBeHidden();
        expect(agendaItemDetails.lessLink).toBeHidden();
      });
    });
  });

  describe("showing and hiding the new form", function() {
    it("hides comments and empties out and shows the form fields & create button when #showNewForm is called", function() {
      agendaItemDetails.editableBody.val("woweee!");
      agendaItemDetails.editableDetails.val("cocooo!");
      agendaItemDetails.cancelEdit();

      var now = new Date();
      spyOn(window, 'Date').andReturn(now);

      expect(agendaItemDetails.createButton).toBeHidden();
      agendaItemDetails.showNewForm();
      expect(agendaItemDetails.form).toBeVisible();
      expect(agendaItemDetails.editableBody.val()).toBe('');
      expect(agendaItemDetails.editableDetails.val()).toBe('');
      expect(agendaItemDetails.charsRemaining.text()).toBe('140');

      expect(agendaItemDetails.createButton).toBeVisible();
      expect(agendaItemDetails.cancelEditButton).toBeHidden();
      expect(agendaItemDetails.updateButton).toBeHidden();
      expect(agendaItemDetails.comments).toBeHidden();

      expect(agendaItemDetails.avatar.user()).toBe(Application.currentUser());
      expect(agendaItemDetails.creatorName.text()).toBe(Application.currentUser().fullName());
      expect(agendaItemDetails.createdAt.text()).toBe($.PHPDate("M j, Y @ g:ia", now));

      agendaItemDetails.agendaItem(agendaItem);

      expect(agendaItemDetails.form).toBeHidden();
      expect(agendaItemDetails.createButton).toBeHidden();
      expect(agendaItemDetails.cancelEditButton).toBeHidden();
      expect(agendaItemDetails.updateButton).toBeHidden();
      expect(agendaItemDetails.comments).toBeVisible();
    });
  });

  describe("when the create button is clicked", function() {
    var fieldValues;

    beforeEach(function() {
      Application.questionPage.question(question);
      useFakeServer();
      agendaItemDetails.showNewForm();
      fieldValues = {
        body: "Relish",
        details: "That green stuff..."
      };

      agendaItemDetails.editableBody.val(fieldValues.body);
      agendaItemDetails.editableDetails.val(fieldValues.details);
    });

    describe("when the current user is a member", function() {
      describe("when the body field is filled in", function() {
        it("creates a new agendaItems with the given body and details on the server and hides the form", function() {
          agendaItemDetails.createButton.click();

          expect(Server.creates.length).toBe(1);

          expect(Server.lastCreate.record.dirtyWireRepresentation()).toEqual(_.extend(fieldValues, {question_id: question.id()}));
          Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

          expect(Path.routes.current).toBe(question.url());
        });

        it("wires the form submit event to save", function() {
          agendaItemDetails.form.submit();
          expect(Server.updates.length).toBe(1);
        });
      });

      describe("when the body field is empty", function() {
        it("does nothing", function() {
          spyOn(History, 'pushState');
          agendaItemDetails.editableBody.val('                  ');
          agendaItemDetails.createButton.click();
          expect(Server.creates.length).toBe(0);
          expect(History.pushState).not.toHaveBeenCalled();
        });
      });
    });

    describe("when the current user is a guest", function() {
      var guest, member;

      beforeEach(function() {
        spyOn(agendaItem, 'editableByCurrentUser').andReturn(true);
        guest = organization.makeMember({id: 5, guest: true});
        member = organization.makeMember({id: 6, emailAddress: "member@example.com"});
        Application.currentUser(guest);

        Application.questionPage.params({questionId: question.id(), agendaItemId: 'new'});

        agendaItemDetails.editableBody.val(fieldValues.body);
        agendaItemDetails.editableDetails.val(fieldValues.details);
      });

      describe("when the guest signs up at the prompt", function() {
        it("creates the agendaItem", function() {
          agendaItemDetails.createButton.click();

          expect(Server.creates.length).toBe(0);
          expect(Application.signupForm).toBeVisible();
          Application.signupForm.firstName.val("Dude");
          Application.signupForm.lastName.val("Richardson");
          Application.signupForm.emailAddress.val("dude@example.com");
          Application.signupForm.password.val("wicked");
          Application.signupForm.form.submit();
          expect($.ajax).toHaveBeenCalled();

          $.ajax.mostRecentCall.args[0].success({ current_user_id: member.id() });
          Server.lastFetch.simulateSuccess(); // fetch member's rankings

          expect(Server.creates.length).toBe(1);

          var createdAgendaItem = Server.lastCreate.record;

          expect(createdAgendaItem.question()).toBe(question);
          expect(createdAgendaItem.body()).toBe(fieldValues.body);
          expect(createdAgendaItem.details()).toBe(fieldValues.details);

          Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

          expect(Path.routes.current).toBe(question.url());
        });
      });

      describe("when the guest logs in", function() {
        it("creates the agendaItem", function() {
          agendaItemDetails.createButton.click();

          expect(Server.creates.length).toBe(0);
          expect(Application.signupForm).toBeVisible();
          Application.signupForm.loginFormLink.click();

          // simulate login
          Application.loginForm.emailAddress.val("member@example.com");
          Application.loginForm.password.val("password");
          Application.loginForm.form.submit();
          expect($.ajax).toHaveBeenCalled();
          $.ajax.mostRecentCall.args[0].success({ current_user_id: member.id() });
          Server.lastFetch.simulateSuccess(); // fetch new user rankings

          expect(Server.creates.length).toBe(1);

          var createdAgendaItem = Server.lastCreate.record;

          expect(createdAgendaItem.question()).toBe(question);
          expect(createdAgendaItem.body()).toBe(fieldValues.body);
          expect(createdAgendaItem.details()).toBe(fieldValues.details);

          Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

          expect(Path.routes.current).toBe(question.url());
        });
      });
    });
  });
  
  describe("handling of the enter key on the body textarea", function() {
    beforeEach(function() {
      Application.questionPage.question(question);
      useFakeServer();
    });

    it("creates the agendaItem when the new form is showing", function() {
      agendaItemDetails.showNewForm();
      agendaItemDetails.editableBody.val("Blah");
      agendaItemDetails.editableBody.trigger({ type : 'keydown', which : 13 });
      expect(Server.creates.length).toBe(1);
    });

    it("updates the agendaItem when the edit form is showing", function() {
      agendaItemDetails.editButton.click();
      agendaItemDetails.editableBody.val("Blah");
      agendaItemDetails.editableBody.trigger({ type : 'keydown', which : 13 });
      expect(Server.updates.length).toBe(1);
    });
  });

  describe("showing and hiding of the edit form", function() {
    it("shows and populates the form fields and sets focus when edit is clicked and hides them when cancel is clicked", function() {
      expect(agendaItemDetails.form).toBeHidden();
      expect(agendaItemDetails.nonEditableContent).toBeVisible();

      agendaItemDetails.editButton.click();

      expect(agendaItemDetails.form).toBeVisible();
      expect(agendaItemDetails.updateButton).toBeVisible();
      expect(agendaItemDetails.cancelEditButton).toBeVisible();
      expect(agendaItemDetails.nonEditableContent).toBeHidden();

      expect(agendaItemDetails.editableBody.val()).toBe(agendaItem.body());
      expect(agendaItemDetails.editableBody[0]).toBe(document.activeElement);
      expect(agendaItemDetails.charsRemaining.text()).toBe((140 - agendaItem.body().length).toString());
      expect(agendaItemDetails.editableDetails.val()).toBe(agendaItem.details());
      expect(agendaItemDetails.expanded()).toBeTruthy();

      agendaItemDetails.cancelEditButton.click();

      expect(agendaItemDetails.form).toBeHidden();
      expect(agendaItemDetails.updateButton).toBeHidden();
      expect(agendaItemDetails.cancelEditButton).toBeHidden();
      expect(agendaItemDetails.nonEditableContent).toBeVisible();
      expect(agendaItemDetails.expanded()).toBeFalsy();
    });

    it("does not show the comments if they are still loading", function() {
      agendaItemDetails.comments.loading(true);
      agendaItemDetails.editButton.click();
      agendaItemDetails.cancelEditButton.click();
      expect(agendaItemDetails.comments).toBeHidden();
    });
  });

  describe("when the update button is clicked", function() {
    var fieldValues;

    beforeEach(function() {
      useFakeServer();
      agendaItemDetails.editButton.click();
      fieldValues = {
        body: "Relish",
        details: "That green stuff..."
      }

      agendaItemDetails.editableBody.val(fieldValues.body);
      agendaItemDetails.editableDetails.val(fieldValues.details);
    });

    it("updates the record's body and details on the server and hides the form", function() {
      agendaItemDetails.updateButton.click();
  
      expect(Server.updates.length).toBe(1);

      expect(Server.lastUpdate.dirtyFieldValues).toEqual(fieldValues);
      Server.lastUpdate.simulateSuccess();

      expect(agendaItemDetails.form).toBeHidden();
      expect(agendaItemDetails.nonEditableContent).toBeVisible();
      
      expect(agendaItemDetails.body.text()).toBe(fieldValues.body);
      expect(agendaItemDetails.details.text()).toBe(fieldValues.details);
    });

    it("wires the form submit event to save", function() {
      agendaItemDetails.form.submit();
      expect(Server.updates.length).toBe(1);
    });

    it("does not allow a blank body", function() {
      spyOn(History, 'pushState');
      agendaItemDetails.editableBody.val('  ');
      agendaItemDetails.updateButton.click();
      expect(Server.updates.length).toBe(0);
      expect(History.pushState).not.toHaveBeenCalled();
    });

    it("does not allow a body exceeding 140 chars", function() {
      var longBody = ""
      _.times(141, function() {
        longBody += "X"
      });

      spyOn(History, 'pushState');
      agendaItemDetails.editableBody.val(longBody);
      agendaItemDetails.updateButton.click();
      expect(Server.updates.length).toBe(0);
      expect(History.pushState).not.toHaveBeenCalled();
    });
  });

  describe("when the destroy button is clicked", function() {
    beforeEach(function() {
      useFakeServer();
    });

    describe("if the user accepts the confirmation", function() {
      it("deletes the agendaItem", function() {
        spyOn(window, 'confirm').andReturn(true);

        agendaItemDetails.destroyButton.click();

        expect(Server.destroys.length).toBe(1);
        expect(Server.lastDestroy.record).toBe(agendaItem);
      });
    });

    describe("if the user rejects the confirmation", function() {
      it("does not delete the agendaItem", function() {
        spyOn(window, 'confirm').andReturn(false);

        agendaItemDetails.destroyButton.click();

        expect(Server.destroys.length).toBe(0);
      });
    });
  });

  describe("when the agendaItem is destroyed", function() {
    it("navigates to the question url", function() {
      agendaItem.remotelyDestroyed();
      expect(Path.routes.current).toBe(question.url());
    });
  });
  
  describe("adjustment of the comments height", function() {
    var longText;

    beforeEach(function() {
      longText = "";
      for (var i = 0; i < 10; i++) longText += "Bee bee boo boo ";
    });

    describe("when the details/body are assigned and when they change", function() {
      it("adjusts the comments to fill the remaining available height", function() {
        Application.questionPage.showAgendaItemDetails();
        expectCommentsToHaveFullHeight();

        agendaItem.remotelyUpdated({body: longText});
        expectCommentsToHaveFullHeight();

        agendaItem.remotelyUpdated({details: longText});
        expectCommentsToHaveFullHeight();
      });
    });

    describe("when the window is resized", function() {
      it("adjusts the comments to fill the remaining available height", function() {
        Application.questionPage.width(1200);
        agendaItem.remotelyUpdated({details: longText});

        Application.questionPage.width(800);
        $(window).resize();
        expectCommentsToHaveFullHeight();
      });
    });

    function expectCommentsToHaveFullHeight() {
      var commentsBottom = agendaItemDetails.comments.position().top + agendaItemDetails.comments.outerHeight();
      expect(commentsBottom).toBe(agendaItemDetails.outerHeight() - parseInt(agendaItemDetails.css('padding-bottom')));
    }
  });

  describe("showing and hiding of the details clearing div", function() {
    it("only shows the clearing div if there are details", function() {
      expect(agendaItemDetails.detailsClearDiv).toBeVisible();
      agendaItem.remotelyUpdated({details: ""});
      expect(agendaItemDetails.detailsClearDiv).toBeHidden();
    });
  });

  describe("loading", function() {
    it("assigns loading to the comments", function() {
      agendaItemDetails.loading(true);
      expect(agendaItemDetails.comments.loading()).toBeTruthy();
      agendaItemDetails.loading(false);
      expect(agendaItemDetails.comments.loading()).toBeFalsy();
    });
  });

  describe("mixpanel tracking", function() {
    beforeEach(function() {
      useFakeServer();
      mpq = [];
    });

    describe("when the agendaItem is assigned", function() {
      beforeEach(function() {
        agendaItemDetails.agendaItem(null);
      });

      it("pushes a 'view agendaItem' event to the mixpanel queue", function() {
        agendaItemDetails.agendaItem(agendaItem);
        expect(mpq.length).toBe(1);
        var event = mpq.pop();
        expect(event[0]).toBe('track');
        expect(event[1]).toBe('View AgendaItem');
      });
    });

    describe("when an agendaItem is created", function() {
      beforeEach(function() {
        Application.questionPage.question(question);
        agendaItemDetails.showNewForm();
        agendaItemDetails.editableBody.val("muesli");
        agendaItemDetails.editableDetails.val("non-vegan, plz");
        mpq = [];
      });

      it("pushes a 'create agendaItem' event to the mixpanel queue", function() {
        agendaItemDetails.createButton.click();
        Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

        expect(mpq.length).toBe(1);
        var event = mpq.pop();
        expect(event[0]).toBe('track');
        expect(event[1]).toBe('Create AgendaItem');
      });
    });

    describe("when an agendaItem is updated", function() {
      it("pushes an 'update agendaItem' event to the mixpanel queue", function() {
        agendaItemDetails.editButton.click();
        agendaItemDetails.editableBody.val("i have changed my mind.");
        agendaItemDetails.updateButton.click();
        Server.lastUpdate.simulateSuccess();

        expect(mpq.length).toBe(1);
        var event = mpq.pop();
        expect(event[0]).toBe('track');
        expect(event[1]).toBe('Update AgendaItem');
      });
    });
  });
});
