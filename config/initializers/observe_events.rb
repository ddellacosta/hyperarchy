unless Rails.env.test?
  EventObserver.observe(AgendaItem, AgendaItemNote, Meeting, MeetingNote, Membership, Team, Ranking, User, Vote)
end
