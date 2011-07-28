//= require spec/spec_helper

describe("Views.Lightboxes.SignupForm", function() {
  var signupForm, darkenedBackground;
  beforeEach(function() {
    renderLayout();
    darkenedBackground = Application.darkenedBackground;
    signupForm = Application.signupForm;
    expect(signupForm).toExist();
    signupForm.show();
  });

  describe("#afterShow / #afterHide", function() {
    it("shows / hides the darkened background, hides the team section, and focuses the first field", function() {
      expect(signupForm).toBeVisible();
      expect(darkenedBackground).toBeVisible();
      signupForm.showTeamSection();

      signupForm.hide();

      expect(signupForm).not.toBeVisible();
      expect(darkenedBackground).not.toBeVisible();
      
      signupForm.show();

      expect(signupForm.errors).toBeHidden();
      expect(signupForm.teamSection).toBeHidden();
      expect(darkenedBackground).toBeVisible();

      expect(Application.signupForm.firstName[0]).toBe(document.activeElement);
    });
  });

  describe("loginFormLink", function() {
    it("shows the login form when clicked", function() {
      var loginForm = Application.loginForm;
      expect(loginForm).toBeHidden();
      signupForm.loginFormLink.click();
      expect(signupForm).toBeHidden();
      expect(loginForm).toBeVisible();
    });
  });

  describe("form submission", function() {
    beforeEach(function() {
      enableAjax();
    });

    describe("when the fields are valid and the form is submitted", function() {
      it("creates a user and logs them in according to the information entered and hides the form", function() {
        fetchInitialRepositoryContents();
        spyOn(Application, 'showPage');

        var signupForm = Application.signupForm;
        signupForm.firstName.val("Richard");
        signupForm.lastName.val("Nixon");
        signupForm.emailAddress.val("dick@hell.de");
        signupForm.password.val("integrity");


        waitsFor("successful signup", function(complete) {
          signupForm.form.trigger('submit', complete);
        });

        runs(function() {
          var user = Application.currentUser();
          expect(user.guest()).toBeFalsy();
          expect(user.firstName()).toEqual("Richard");
          expect(user.lastName()).toEqual("Nixon");
          expect(user.emailAddress()).toEqual("dick@hell.de");
          expect(signupForm).toBeHidden();
          expect(Application.darkenedBackground).toBeHidden();
        });
      });
    });

    describe("when the fields are invalid and the form is submitted", function() {
      it("displays an error message", function() {
        var signupForm = Application.signupForm;

        signupForm.firstName.val("Richard");
        signupForm.lastName.val("Nixon");
        signupForm.emailAddress.val("");

        waitsFor("invalid signup", function(complete) {
          signupForm.form.trigger('submit', {error: complete});
        });

        runs(function() {
          expect(signupForm.errors).toBeVisible();
          expect(signupForm.errors.text()).toContain("email address");
          expect(signupForm).toBeVisible();
        });
      });
    });

    describe("when the team section is visible and the team name is specified", function() {
      it("signs them up and directs them to the main page of their new team", function() {
        fetchInitialRepositoryContents();
        spyOn(Application, 'showPage');

        var signupForm = Application.signupForm;
        signupForm.teamSection.show();
        signupForm.firstName.val("Richard");
        signupForm.lastName.val("Nixon");
        signupForm.emailAddress.val("dick@hell.de");
        signupForm.teamName.val("dick's group");
        signupForm.password.val("integrity");

        waitsFor("successful signup", function(complete) {
          signupForm.form.trigger('submit', complete);
        });

        runs(function() {
          var user = Application.currentUser();
          expect(user.guest()).toBeFalsy();
          expect(user.firstName()).toEqual("Richard");
          expect(user.lastName()).toEqual("Nixon");
          expect(user.emailAddress()).toEqual("dick@hell.de");
          expect(user.teams().size()).toBe(1);

          var org = user.teams().find({name: "dick's group"});
          expect(Path.routes.current).toEqual(org.url());
          expect(signupForm).toBeHidden();
          expect(Application.darkenedBackground).toBeHidden();
        });
      });
    });
  });

  describe("when the facebook login link is clicked", function() {
    var successTriggered, cancelTriggered, facebookLoginPromise;
    beforeEach(function() {
      signupForm.bind('success', function() {
        successTriggered = true;
      });
      signupForm.bind('cancel', function() {
        cancelTriggered = true;
      });

      facebookLoginPromise = new Monarch.Promise();
      spyOn(Application, 'facebookLogin').andReturn(facebookLoginPromise);
    });

    describe("when in 'normal' mode", function() {
      describe("when facebook login succeeds", function() {
        it("calls Application.facebookLogin and triggers success / hides itself when it succeeds", function() {
          signupForm.facebookLoginButton.click();

          expect(Application.facebookLogin).toHaveBeenCalled();
          facebookLoginPromise.triggerSuccess();

          expect(successTriggered).toBeTruthy();
          expect(signupForm).toBeHidden();
        });
      });
    });

    describe("when in 'add team' mode", function() {
      beforeEach(function() {
        signupForm.showTeamSection();
      });

      describe("when facebook login succeeds", function() {
        it("shows the add team form", function() {
          signupForm.facebookLoginButton.click();

          expect(Application.facebookLogin).toHaveBeenCalled();
          facebookLoginPromise.triggerSuccess();

          expect(successTriggered).toBeTruthy();
          expect(signupForm).toBeHidden();
          expect(Application.addTeamForm).toBeVisible();
          expect(Application.darkenedBackground).toBeVisible();
        });
      });
    });
  });
  
  describe("when the twitter login link is clicked", function() {
    var successTriggered, cancelTriggered, twitterLoginPromise;
    beforeEach(function() {
      signupForm.bind('success', function() {
        successTriggered = true;
      });
      signupForm.bind('cancel', function() {
        cancelTriggered = true;
      });

      twitterLoginPromise = new Monarch.Promise();
      spyOn(Application, 'twitterLogin').andReturn(twitterLoginPromise);
    });

    describe("when in 'normal' mode", function() {
      describe("when twitter login succeeds", function() {
        it("calls Application.twitterLogin and triggers success / hides itself when it succeeds", function() {
          signupForm.twitterLoginButton.click();

          expect(Application.twitterLogin).toHaveBeenCalled();
          twitterLoginPromise.triggerSuccess();

          expect(successTriggered).toBeTruthy();
          expect(signupForm).toBeHidden();
        });
      });
    });

    describe("when in 'add team' mode", function() {
      beforeEach(function() {
        signupForm.showTeamSection();
      });

      describe("when twitter login succeeds", function() {
        it("shows the add team form", function() {
          signupForm.twitterLoginButton.click();

          expect(Application.twitterLogin).toHaveBeenCalled();
          twitterLoginPromise.triggerSuccess();

          expect(successTriggered).toBeTruthy();
          expect(signupForm).toBeHidden();
          expect(Application.addTeamForm).toBeVisible();
          expect(Application.darkenedBackground).toBeVisible();
        });
      });
    });
  });
});
