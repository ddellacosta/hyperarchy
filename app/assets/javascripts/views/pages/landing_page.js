_.constructor('Views.Pages.Landing', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "landing"}, function() {
      form(function() {
        input().ref('date');
        input().ref('time');
        input({type: "submit", value: "Invite Your Team"}).ref('submitButton');
      }).ref('form').submit("createMeeting");
    });
  }},

  viewProperties: {
    attach: function() {
      var time = new Date().next().friday();
      if (time.getMinutes() > 30) {
        time.setMinutes(30);
      } else {
        time.setMinutes(0);
      }
      this.time.val($.PHPDate("g:ia", time));
      this.date.val($.PHPDate("m/j/Y", time));

      this.date.calendricalDate({usa: true});
      this.time.calendricalTime({ timeInterval: 30 });
    },

    promptSignup: function() {
      Application.promptSignup().success(this.hitch('createMeeting'));
      return false;
    },

    createMeeting: function(e) {
      e.preventDefault();
      var promise = new Monarch.Promise();
      Application.promptSignup()
        .success(function() {
          Meeting.create({startsAt: this.selectedDate()})
            .success(function(meeting) {
              Team.fetch(meeting.teamId()).success(function() {
                History.pushState(null, null, meeting.url());
                Application.inviteBox.show();
                promise.triggerSuccess();
              });
            });
        }, this);

      return promise;
    },

    selectedDate: function() {
      console.log(this.date.val() + " " + this.time.val());
      console.log(Date.parse(this.date.val() + " " + this.time.val()));
      return Date.parse(this.date.val() + " " + this.time.val());
    }
  }
});
