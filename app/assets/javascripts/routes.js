Path.map('/').to(function() {
  if (Application.currentUser().defaultTeam()) {
    _.defer(function() {
      History.replaceState(null, null, Application.currentUser().defaultTeam().url());
    });
  } else {
    Application.showPage('landing');
  }
});

Path.map('/teams/:teamId').to(function() {
  Application.showPage('team', this.params);
});

Path.map('/teams/:teamId/settings').to(function() {
  Application.showPage('teamSettings', this.params);
});

Path.map('/teams/:teamId/meetings/new').to(function() {
  Application.showPage('meeting', { teamId: this.params.teamId, meetingId: 'new'});
});

Path.map('/meetings/:meetingId').to(function() {
  Application.showPage('meeting', this.params);
});

Path.map('/meetings/:meetingId/full_screen').to(function() {
  Application.showPage('meeting', _.extend(this.params, {fullScreen: true}));
});
                                           // also handles 'new'
Path.map('/meetings/:meetingId/agenda_items/:agendaItemId').to(function() {
  Application.showPage('meeting', this.params);
});

Path.map('/meetings/:meetingId/agenda_items/:agendaItemId/full_screen').to(function() {
  Application.showPage('meeting', _.extend(this.params, {fullScreen: true}));
});

Path.map('/meetings/:meetingId/votes/:voterId').to(function() {
  Application.showPage('meeting', this.params);
});
