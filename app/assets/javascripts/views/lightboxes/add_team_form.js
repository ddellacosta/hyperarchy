//= require ./lightbox

_.constructor('Views.Lightboxes.AddTeamForm', Views.Lightboxes.Lightbox, {
  id: "add-team-form",

  lightboxContent: function() { with(this.builder) {
    form(function() {
      h2("What is your team's name?");
      input().ref("name");
      input({value: "Add Team", 'class': "button", type: "submit"}).ref("createButton");
    }).ref('form').submit('create');
  }},

  viewProperties: {
    create: function(e) {
      e.preventDefault();
      if ($.trim(this.name.val()) === "") return false;
      return Team.create({name: this.name.val()}).success(function(team) {
        team.trackCreate();
        team.memberships({userId: Application.currentUserId()}).fetch().success(function() {
          History.pushState(null, null, team.url());
          this.close();
        }, this);
      }, this);
    }
  }
});

