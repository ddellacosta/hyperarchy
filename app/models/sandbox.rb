class Sandbox < Prequel::Sandbox
  attr_reader :user
  def initialize(user)
    @user = user
  end

  expose :teams do
    if user.admin?
      Team.table
    else
      user.teams | Team.where(Team[:privacy].neq("private"))
    end
  end

  expose :memberships do
    Membership.table
  end

  expose :users do
    User.table
  end

  expose :questions do
    teams.join_through(Question)
  end

  expose :question_notes do
    questions.join_through(QuestionNote)
  end

  expose :agenda_items do
    questions.join_through(AgendaItem)
  end

  expose :votes do
    questions.join_through(Vote)
  end

  expose :question_visits do
    user.question_visits
  end

  expose :rankings do
    questions.join_through(Ranking)
  end

  expose :agenda_item_notes do
    agenda_items.join_through(AgendaItemNote)
  end

  def subscribe(*args)
    # subscribe is disabled for now in favor of the custom SubscriptionManager
    raise SecurityError
  end
end
