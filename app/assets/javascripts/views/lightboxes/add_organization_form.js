//  Copyright (c) 2010-2011, Nathan Sobo and Max Brunsfeld.  This file is
//  licensed under the Affero General Public License version 3 or later.  See
//  the COPYRIGHT file.

_.constructor('Views.Lightboxes.AddOrganizationForm', Views.Lightboxes.Lightbox, {
  id: "add-organization-form",

  lightboxContent: function() { with(this.builder) {
    form(function() {
      h2("What is your organization's name?");
      input().ref("name");
      input({value: "Add Organization", 'class': "button", type: "submit"}).ref("createButton");
    }).ref('form').submit('create');
  }},

  viewProperties: {
    create: function(e) {
      e.preventDefault();
      if ($.trim(this.name.val()) === "") return false;
      return Organization.create({name: this.name.val()}).onSuccess(function(organization) {
        organization.trackCreate();
        organization.memberships({userId: Application.currentUserId()}).fetch().onSuccess(function() {
          History.pushState(null, null, organization.url());
          this.close();
        }, this);
      }, this);
    }
  }
});

