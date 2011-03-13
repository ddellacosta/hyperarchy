_.constructor("Views.Layout", View.Template, {
  content: function() { with(this.builder) {
    div({id: "application"}, function() {

      div({id: "header"}, function() {
        div({id: "logoWrapper"}, function() {
          div({id: "logo"}).click('goToLastOrganization');
        });
        a({'class': "headerItem", href: "#"}, "Log In")
          .ref('loginLink')
          .click("showLoginForm");
        a({'class': "headerItem dropdownLink", href: "#"}, "Account")
          .ref('accountMenuLink')
          .click("toggleAccountMenu");
        a({'class': "headerItem dropdownLink"}, "Organizations")
          .ref("organizationsMenuLink")
          .click("toggleOrganizationsMenu");
        a({'class': "headerItem", href: "#"}, "Invite")
          .ref('inviteLink')
          .click('showInviteForm');
        a({'class': "headerItem", href: "#"}, "Feedback")
          .click('showFeedbackForm');
      });

      div({id: "main"}, function() {
        div({id: "navBar"}, function() {
          div({'class': "navBarContent"}, function() {
            h2({'class': "navBarHeader"})
              .ref('organizationName')
              .click('goToOrganization');
            a({'class': "navBarLink"}, "View Questions")
              .ref('questionsLink')
              .click('goToQuestions');
            a({'class': "navBarLink"}, "Raise a Question")
              .ref("newElectionLink")
              .click("goToNewElection");
            a({'class': "navBarLink"}, "Members")
              .ref('membersLink')
              .click("goToMembers");
            a({'class': "navBarLink"}, "Settings")
              .ref("editOrganizationLink")
              .click("goToEditOrganization");
          }).ref("organizationNavigationBar");

          div({'class': "navBarContent"}, function() {
            h2({'class': "navBarHeader"}).ref("alternateNavigationBarText");
            a({'class': "navBarLink rightSide"})
              .ref("backToLastOrganizationLink")
              .click("goToLastOrganization");
          }).ref("alternateNavigationBar");
        });

        div({id: "subnavStub"}).ref("subNavigationBar");

        div({'id': "content"}, function() {
        }).ref('content');
      }).ref('mainContentArea');

      subview("welcomeGuide", Views.WelcomeGuide);

      div({id: "darkenBackground", style: "display: none"})
        .ref('darkenBackground');
      div({id: "notification", style: "display: none"}).ref("notification");
      subview('signupPrompt', Views.SignupPrompt);
      subview('mustBeMemberMessage', Views.MustBeMemberMessage);
      subview('disconnectDialog', Views.DisconnectDialog);
      subview('inviteForm', Views.Invite);
      div({id: "feedback", style: "display: none", 'class': "dropShadow"}, function() {
        div({'class': "rightCancelX"}).click('hideFeedbackForm');
        div({id: "thanks", 'class': "largeFont"}, function() {
          text("Thanks for taking the time to talk to us! Feel free to get in touch with us via email at ");
          a({href: "mailto:admin@hyperarchy.com"}, "admin@hyperarchy.com");
          text(".")
        });
        textarea().ref("feedbackTextarea");
        a({'class': "glossyBlack roundedButton", href: "#"}, "Send Feedback").click('sendFeedback');
      }).ref("feedbackForm");

      ol({'class': "dropdownMenu"}, function() {
        li(function() {
          a({href: "#view=account"}, "Preferences");
        });
        li(function() {
          a({href: "#"}, "Log Out").click(function(elt, e) {
            e.preventDefault();
            $("<form action='/logout' method='post'>").appendTo($("body")).submit();
            return false;
          });
        });
      }).ref('accountMenu');
      ol({'class': "dropdownMenu"}, function() {
        li(function() {
          a({href: "#"}, "Add Organization...").click('goToAddOrganization');
        }).ref('addOrganizationLi')
      }).ref('organizationsMenu');

    })
  }},

  viewProperties: {

    minHeight: 300,

    initialize: function() {
      $(window).resize(this.hitch('adjustHeight'));
      this.defer(this.hitch('adjustHeight'));
      window.notify = this.hitch('notify');
      this.currentUserSubscriptions = new Monarch.SubscriptionBundle();

      _.each(this.views, function(view) {
        view.hide();
        this.content.append(view);
      }, this);
    },

    adjustHeight: function() {
      this.content.fillVerticalSpace(0);
    },

    organization: {
      afterChange: function(organization) {
        this.organizationName.bindHtml(organization, 'name');
        if (organization.currentUserCanEdit()) {
          this.editOrganizationLink.show();
          this.membersLink.show();
        } else {
          this.editOrganizationLink.hide();
          this.membersLink.hide();
        }
      }
    },

    currentUser: {
      afterChange: function(user) {
        this.currentUserSubscriptions.destroy();

        if (user.guest()) {
          this.loginLink.show();
          this.organizationsMenuLink.hide();
          this.accountMenuLink.hide();
        } else {
          this.loginLink.hide();
          this.organizationsMenuLink.show();
          this.accountMenuLink.show();
        }

        this.populateOrganizations();

        var organizationsPermitted = user.organizationsPermittedToInvite();
        this.currentUserSubscriptions.add(organizationsPermitted.onInsert(this.hitch('showOrHideInviteLink')));
        this.currentUserSubscriptions.add(organizationsPermitted.onRemove(this.hitch('showOrHideInviteLink')));
        this.showOrHideInviteLink();
      }
    },

    showOrganizationNavigationBar: function() {
      this.alternateNavigationBar.hide();
      this.organizationNavigationBar.show();
    },

    showAlternateNavigationBar: function(text) {
      var lastOrgName = Application.currentUser().defaultOrganization().name();
      this.backToLastOrganizationLink.html("Back to " + htmlEscape(lastOrgName));
      this.alternateNavigationBarText.html(text);
      this.organizationNavigationBar.hide();
      this.alternateNavigationBar.show();
    },

    activateNavigationTab: function(linkName) {
      this.organizationNavigationBar.find("a").removeClass('active');
      this[linkName].addClass('active');
    },

    populateOrganizations: function() {
      var organizations =
        this.currentUser().admin() ?
          Organization.orderBy('name')
          : Application.currentUser().confirmedMemberships().joinThrough(Organization).orderBy('name');

      this.currentUserSubscriptions.add(organizations.onEach(this.hitch('populateOrganization')));
      this.currentUserSubscriptions.add(Organization.onUpdate(function(organization, changes) {
        if (!changes.name) return;
        var name = organization.name();
        var selector = 'a[organizationId=' + organization.id() + ']';
        this.organizationsMenu.find(selector).html(htmlEscape(name));
      }, this));
    },

    populateOrganization: function(organization, addToAdminMenu) {
      this.addOrganizationLi.before(View.build(function(b) {
        b.li(function() {
          b.a({href: "#", organizationId: organization.id()}, organization.name()).click(function(view, e) {
            $.bbq.pushState({view: "organization", organizationId: organization.id()});
            e.preventDefault();
          });
        });
      }));
    },

    showOrHideInviteLink: function() {
      if (this.currentUser().guest() || this.currentUser().organizationsPermittedToInvite().empty()) {
        this.inviteLink.hide();
      } else {
        this.inviteLink.show();
      }
    },

    notify: function(message) {
      this.notification.html(message);
      this.notification.slideDown('fast');
      _.delay(_.bind(function() {
        this.notification.slideUp('fast');
        this.notification.empty();
      }, this), 3000);
    },

    toggleOrganizationsMenu: function(elt, e) {
      e.preventDefault();
      this.toggleMenu(this.organizationsMenuLink, this.organizationsMenu);
    },

    toggleAccountMenu: function(elt, e) {
      e.preventDefault();
      this.toggleMenu(this.accountMenuLink, this.accountMenu);
    },

    toggleMenu: function(link, menu) {
      if (menu.is(":visible")) return;
      menu.show();
      menu.position({
        my: "left top",
        at: "left bottom",
        of: link,
        collision: "none"
      });
      _.defer(function() {
        $(window).one('click', function() {
          menu.hide();
        });
      });
    },

    showFeedbackForm: function(elt, e) {
      this.darkenBackground.fadeIn();
      this.darkenBackground.one('click', this.hitch('hideFeedbackForm'));
      this.feedbackForm
        .show()
        .position({
          my: "center",
          at: "center",
          of: this.darkenBackground
        });
      e.preventDefault();
    },

    showInviteForm: function(elt, e) {
      this.darkenBackground.fadeIn();
      this.inviteForm
        .show()
        .position({
          my: "center",
          at: "center",
          of: this.darkenBackground
        });
      e.preventDefault();
    },

    hideFeedbackForm: function(elt, e) {
      this.darkenBackground.hide();
      this.feedbackForm.hide();
    },

    sendFeedback: function() {
      Server.post("/feedback", {
        feedback: this.feedbackTextarea.val()
      }).onSuccess(function() {
        this.hideFeedbackForm();
        this.notify("Thanks for the feedback!")
      }, this);
      return false;
    },

    goToOrganization: function() {
      $.bbq.pushState({view: "organization", organizationId: this.organization().id() }, 2);
      return false;
    },

    goToQuestions: function() {
      $.bbq.pushState({view: "organization", organizationId: this.organization().id() }, 2);
      return false;
    },

    goToQuestion: function(id) {
      $.bbq.pushState({view: "election", electionId: id}, 2);
      return false;
    },

    goToEditOrganization: function() {
      $.bbq.pushState({view: "editOrganization", organizationId: this.organization().id() }, 2);
      return false;
    },

    goToMembers: function() {
      $.bbq.pushState({view: "members", organizationId: this.organization().id() }, 2);
      return false;
    },

    goToNewElection: function() {
      $.bbq.pushState({view: "newElection", organizationId: this.organization().id() }, 2);
      return false;
    },

    goToLastOrganization: function() {
      var organizationId = Application.currentUser().defaultOrganization().id();
      $.bbq.pushState({view: "organization", organizationId: organizationId }, 2);
    },

    goToAddOrganization: function(elt, e) {
      e.preventDefault();
      if (Application.currentUser().guest()) {
        window.location = "/signup"
      } else {
        $.bbq.pushState({view: "addOrganization" }, 2);
      }
    },

    showLoginForm: function() {
      this.signupPrompt.show().showLoginForm();
      return false;
    }
  }
});
