//= require spec/spec_helper

describe("Views.Pages.Meeting.AgendaItemDetails", function() {
  var agendaItemDetails, agendaItem, creator, meeting, team;

  beforeEach(function() {
    renderLayout();
    Application.height(1000);

    agendaItemDetails = Application.meetingPage.agendaItemDetails;
    team = Team.createFromRemote({id: 42});
    creator = team.makeMember({id: 999, emailHash: 'blas', firstName: "Mr.", lastName: "Creator"});
    Application.currentUser(creator);
    meeting = team.meetings().createFromRemote({id: 1, creatorId: 999, createdAt: 12, startsAt: 23456});
    agendaItem = creator.agendaItems().createFromRemote({id: 1, meetingId: 1, body: "Buy more mustard.", createdAt: 1308352736162});

    Application.meetingPage.show();
    Application.meetingPage.showAgendaItemDetails();

    agendaItemDetails.agendaItem(agendaItem);
  });

  describe("when the agendaItem is assigned", function() {
    it("populates the avatar, creator name, and created date", function() {
      expect(agendaItemDetails.avatar.user()).toBe(agendaItem.creator());
      expect(agendaItemDetails.creatorName.text()).toBe(creator.fullName());
      expect(agendaItemDetails.createdAt.text()).toBe(agendaItem.formattedCreatedAt());
    });

    it("removes subscriptions to the previous agendaItem", function() {
      var agendaItem2 = AgendaItem.createFromRemote({id: 57, body: "soup.", meetingId: meeting.id(), createdAt: 1111, creatorId: creator.id()});
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

      agendaItemDetails.agendaItem(agendaItem);

      expect(agendaItemDetails.form).toBeHidden();
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
        var otherAgendaItem = meeting.agendaItems().createFromRemote({id: 100, creatorId: creator.id(), createdAt: 234234});

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
      it("shows the edit button only when the current user is the creator of the agendaItem, an owner of the team, or an admin", function() {
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

  describe("showing and hiding the new form", function() {
    it("hides notes and empties out and shows the form fields & create button when #showNewForm is called", function() {
      agendaItemDetails.editableBody.val("woweee!");
      agendaItemDetails.cancelEdit();

      var now = new Date();
      spyOn(window, 'Date').andReturn(now);

      expect(agendaItemDetails.createButton).toBeHidden();
      agendaItemDetails.showNewForm();
      expect(agendaItemDetails.form).toBeVisible();
      expect(agendaItemDetails.editableBody.val()).toBe('');
      expect(agendaItemDetails.charsRemaining.text()).toBe('140');

      expect(agendaItemDetails.createButton).toBeVisible();
      expect(agendaItemDetails.cancelEditButton).toBeHidden();
      expect(agendaItemDetails.updateButton).toBeHidden();
      expect(agendaItemDetails.notes).toBeHidden();

      expect(agendaItemDetails.avatar.user()).toBe(Application.currentUser());
      expect(agendaItemDetails.creatorName.text()).toBe(Application.currentUser().fullName());
      expect(agendaItemDetails.createdAt.text()).toBe($.PHPDate("M j, Y @ g:ia", now));

      agendaItemDetails.agendaItem(agendaItem);

      expect(agendaItemDetails.form).toBeHidden();
      expect(agendaItemDetails.createButton).toBeHidden();
      expect(agendaItemDetails.cancelEditButton).toBeHidden();
      expect(agendaItemDetails.updateButton).toBeHidden();
      expect(agendaItemDetails.notes).toBeVisible();
    });
  });

  describe("when the create button is clicked", function() {
    var fieldValues;

    beforeEach(function() {
      Application.meetingPage.meeting(meeting);
      useFakeServer();
      agendaItemDetails.showNewForm();
      fieldValues = { body: "Relish" };

      agendaItemDetails.editableBody.val(fieldValues.body);
    });

    describe("when the current user is a member", function() {
      describe("when the body field is filled in", function() {
        it("creates a new agendaItems with the given body and details on the server and hides the form", function() {
          agendaItemDetails.createButton.click();

          expect(Server.creates.length).toBe(1);

          expect(Server.lastCreate.record.dirtyWireRepresentation()).toEqual(_.extend(fieldValues, {meeting_id: meeting.id()}));
          Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

          expect(Path.routes.current).toBe(meeting.url());
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
        guest = team.makeMember({id: 5, guest: true});
        member = team.makeMember({id: 6, emailAddress: "member@example.com"});
        Application.currentUser(guest);

        Application.meetingPage.params({meetingId: meeting.id(), agendaItemId: 'new'});

        agendaItemDetails.editableBody.val(fieldValues.body);
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

          expect(createdAgendaItem.meeting()).toBe(meeting);
          expect(createdAgendaItem.body()).toBe(fieldValues.body);
          expect(createdAgendaItem.details()).toBe(fieldValues.details);

          Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

          expect(Path.routes.current).toBe(meeting.url());
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

          expect(createdAgendaItem.meeting()).toBe(meeting);
          expect(createdAgendaItem.body()).toBe(fieldValues.body);
          expect(createdAgendaItem.details()).toBe(fieldValues.details);

          Server.lastCreate.simulateSuccess({creatorId: Application.currentUser().id()});

          expect(Path.routes.current).toBe(meeting.url());
        });
      });
    });
  });
  
  describe("handling of the enter key on the body textarea", function() {
    beforeEach(function() {
      Application.meetingPage.meeting(meeting);
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
    it("when edit is clicked, shows and populates the body field and sets focus, then hides them when cancel is clicked", function() {
      expect(agendaItemDetails.form).toBeHidden();

      agendaItemDetails.editButton.click();

      expect(agendaItemDetails.editButton).toBeHidden();
      expect(agendaItemDetails.destroyButton).toBeHidden();
      expect(agendaItemDetails.form).toBeVisible();
      expect(agendaItemDetails.updateButton).toBeVisible();
      expect(agendaItemDetails.cancelEditButton).toBeVisible();

      expect(agendaItemDetails.editableBody.val()).toBe(agendaItem.body());
      expect(agendaItemDetails.editableBody[0]).toBe(document.activeElement);
      expect(agendaItemDetails.charsRemaining.text()).toBe((140 - agendaItem.body().length).toString());

      agendaItemDetails.cancelEditButton.click();

      expect(agendaItemDetails.editButton).toBeVisible();
      expect(agendaItemDetails.destroyButton).toBeVisible();
      expect(agendaItemDetails.form).toBeHidden();
      expect(agendaItemDetails.updateButton).toBeHidden();
      expect(agendaItemDetails.cancelEditButton).toBeHidden();
    });

    it("does not show the notes if they are still loading", function() {
      agendaItemDetails.notes.loading(true);
      agendaItemDetails.editButton.click();
      agendaItemDetails.cancelEditButton.click();
      expect(agendaItemDetails.notes).toBeHidden();
    });
  });

  describe("when the update button is clicked", function() {
    var fieldValues;

    beforeEach(function() {
      useFakeServer();
      agendaItemDetails.editButton.click();
      fieldValues = { body: "Relish" };

      agendaItemDetails.editableBody.val(fieldValues.body);
    });

    it("updates the record's body and details on the server and hides the form", function() {
      agendaItemDetails.updateButton.click();
  
      expect(Server.updates.length).toBe(1);

      expect(Server.lastUpdate.dirtyFieldValues).toEqual(fieldValues);
      Server.lastUpdate.simulateSuccess();

      expect(agendaItemDetails.form).toBeHidden();
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
    it("navigates to the meeting url", function() {
      agendaItem.remotelyDestroyed();
      expect(Path.routes.current).toBe(meeting.url());
    });
  });
  
  describe("adjustment of the notes height", function() {
    describe("when the window is resized", function() {
      it("adjusts the notes to fill the remaining available height", function() {
        Application.meetingPage.height(400);
        $(window).resize();
        expectNotesToHaveFullHeight();

        Application.meetingPage.height(800);
        $(window).resize();
        expectNotesToHaveFullHeight();
      });
    });

    function expectNotesToHaveFullHeight() {
      var notesBottom = agendaItemDetails.notes.position().top + agendaItemDetails.notes.outerHeight();
      expect(notesBottom).toBe(agendaItemDetails.outerHeight() - parseInt(agendaItemDetails.css('padding-bottom')));
    }
  });

  describe("loading", function() {
    it("assigns loading to the notes", function() {
      agendaItemDetails.loading(true);
      expect(agendaItemDetails.notes.loading()).toBeTruthy();
      agendaItemDetails.loading(false);
      expect(agendaItemDetails.notes.loading()).toBeFalsy();
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
        Application.meetingPage.meeting(meeting);
        agendaItemDetails.showNewForm();
        agendaItemDetails.editableBody.val("muesli");
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
