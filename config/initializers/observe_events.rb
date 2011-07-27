unless Rails.env.test?
  EventObserver.observe(AgendaItem, AgendaItemNote, Question, QuestionNote, Membership, Team, Ranking, User, Vote)
end
