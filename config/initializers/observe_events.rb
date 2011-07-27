unless Rails.env.test?
  EventObserver.observe(AgendaItem, AgendaItemComment, Question, QuestionComment, Membership, Organization, Ranking, User, Vote)
end
