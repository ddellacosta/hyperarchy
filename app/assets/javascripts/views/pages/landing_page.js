_.constructor('Views.Pages.Landing', Monarch.View.Template, {
  content: function() { with(this.builder) {
    div({id: "landing"}, function() {
      input().ref('date');
      input().ref('time');
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
    }
  }
});
