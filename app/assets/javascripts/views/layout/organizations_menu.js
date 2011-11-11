//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

_.constructor('Views.Layout.OrganizationsMenu', View.Template, {
  content: function() { with(this.builder) {
    div({id: "organizations-menu"}, function() {
      a({id: "add-organization-link"}, "Add Your Organization").ref('addOrganizationLink').click("showAddOrganizationForm");
      subview("dropdownMenu", Views.Layout.DropdownMenu, {
        linkContent: function() {
          this.builder.text("Organizations");
        },

        menuContent: function() {
          var b = this.builder;
          this.builder.subview('organizationsList', Views.Components.SortedList, {
            buildElement: function(organization) {
              return Views.Layout.OrganizationsMenuItem.toView({organization: organization});
              return $("<li><a>" + organization.name() +"</a></li>").click(function() {
                History.pushState(null, null, organization.url());
              });
            }
          });
          this.builder.a({id: "add-organization-menu-item"}, "Add Your Organization").ref('addOrganizationLink').click("showAddOrganizationForm");
        }
      });
    });
  }},

  viewProperties: {
    initialize: function() {
      this.userSubscriptions = new OldMonarch.SubscriptionBundle();
      this.dropdownMenu.showAddOrganizationForm = this.hitch('showAddOrganizationForm');
    },

    attach: function() {
      Application.onCurrentUserChange(function(user) {
        this.showOrHideDropdownLink();
        this.userSubscriptions.destroy();
        this.userSubscriptions.add(user.organizations().onInsert(this.hitch('showOrHideDropdownLink')));
        this.userSubscriptions.add(user.organizations().onRemove(this.hitch('showOrHideDropdownLink')));
        this.dropdownMenu.organizationsList.relation(user.organizations());
      }, this);
    },

    beforeRemove: function() {
      if (this.userSubscriptions) this.userSubscriptions.destroy();
    },

    showOrHideDropdownLink: function() {
      if (Application.currentUser().organizations().size() > 1) {
        this.dropdownMenu.show();
        this.addOrganizationLink.hide();
      } else {
        this.dropdownMenu.hide();
        this.addOrganizationLink.show();
      }
    },

    showAddOrganizationForm: function() {
      if (Application.currentUser().guest()) {
        Application.signupForm.show();
        Application.signupForm.showOrganizationSection();
      } else {
        Application.addOrganizationForm.show();
      }
    }
  }
});

