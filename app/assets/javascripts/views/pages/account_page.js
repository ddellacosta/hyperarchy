//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

_.constructor('Views.Pages.Account', OldMonarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: 'account'}, function() {
      form({id: "personal-details"}, function() {
        h2("Personal Details");
        label("First Name");
        input({name: "firstName"}).ref('firstName');
        label("Last Name");
        input({name: "lastName"}).ref('lastName');
        label("Email Address");
        input({name: "emailAddress"}).ref('emailAddress');

        div(function() {
          text("If you aren't Facebook connected, you can associate a profile image with your email address at ");
          a({href: "http://gravatar.com", 'class': "link", target: "gravatar"}, "gravatar.com");
        });

        input({type: "submit", value: "Save", 'class': "update button"}).ref('updateButton');
      }).ref('personalDetails').submit('update');

      div({id: "email-preferences"}, function() {
        h2("Email Preferences");
        input({type: "checkbox", name: "emailEnabled", id: "email-enabled"}).ref('emailEnabled').change('updateEmailEnabled');
        label({'for': "email-enabled"}, "I want to receive email (global setting)");

        subview('membershipPreferences', Views.Components.SortedList, {
          buildElement: function(membership) {
            return Views.Pages.Account.MembershipPreferencesLi.toView({membership: membership});
          }
        });
      });
    });
  }},

  viewProperties: {
    params: {
      change: function(params) {
        var user = User.find(params.userId);
        Application.currentOrganization(user.defaultOrganization());
        this.user(user);
      }
    },

    user: {
      change: function(user) {
        this.model(user);
        this.enableOrDisableUpdateButton();
        this.personalDetails.find('input').bind('keyup paste cut change', this.hitch('enableOrDisableUpdateButton'));
        this.membershipPreferences.relation(user.memberships());
        this.enableOrDisableMembershipPreferences();
      }
    },

    enableOrDisableUpdateButton: function() {
      var canSave = !this.fieldValuesMatchModel() && this.noDetailsEmpty();
      this.updateButton.attr('disabled', !canSave);
    },

    noDetailsEmpty: function() {
      return _.all([this.firstName, this.lastName, this.emailAddress], function(field) {
        return $.trim(field.val()) !== "";
      });
    },

    update: function() {
      this.user().update(this.personalDetails.fieldValues());
      return false;
    },

    updateEmailEnabled: function() {
      this.user().update({emailEnabled: this.emailEnabled.attr('checked')})
        .success(this.hitch('enableOrDisableMembershipPreferences'));
    },

    enableOrDisableMembershipPreferences: function() {
      if (this.user().emailEnabled()) {
        this.membershipPreferences.removeClass('disabled');
        this.membershipPreferences.find('select').attr('disabled', false);
      } else {
        this.membershipPreferences.addClass('disabled');
        this.membershipPreferences.find('select').attr('disabled', true);
      }
    }
  }
});
