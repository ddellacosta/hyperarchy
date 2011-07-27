Path.map('/').to(function() {
  _.defer(function() {
    History.replaceState(null, null, Application.currentUser().defaultTeam().url());
  })
});

Path.map('/teams/:teamId').to(function() {
  Application.showPage('team', this.params);
});

Path.map('/teams/:teamId/settings').to(function() {
  Application.showPage('teamSettings', this.params);
});

Path.map('/teams/:teamId/questions/new').to(function() {
  Application.showPage('question', { teamId: this.params.teamId, questionId: 'new'});
});

Path.map('/questions/:questionId').to(function() {
  Application.showPage('question', this.params);
});

Path.map('/questions/:questionId/full_screen').to(function() {
  Application.showPage('question', _.extend(this.params, {fullScreen: true}));
});
                                           // also handles 'new'
Path.map('/questions/:questionId/agenda_items/:agendaItemId').to(function() {
  Application.showPage('question', this.params);
});

Path.map('/questions/:questionId/agenda_items/:agendaItemId/full_screen').to(function() {
  Application.showPage('question', _.extend(this.params, {fullScreen: true}));
});

Path.map('/questions/:questionId/votes/:voterId').to(function() {
  Application.showPage('question', this.params);
});

Path.map('/account').to(function() {
  function showAccountPage() {
    Application.showPage('account', {userId: Application.currentUserId()});
  }

  var currentUser = Application.currentUser();

  if (currentUser.guest()) {
    Application.promptLogin()
      .success(showAccountPage)
      .invalid(function() {
        History.replaceState(null, null, currentUser.defaultTeam().url());
      });
  } else {
    showAccountPage();
  }
});
