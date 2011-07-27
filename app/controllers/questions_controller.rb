class QuestionsController < ApplicationController
  def index
    team = Team.find(params[:team_id])
    raise SecurityError unless team.current_user_can_read?

    offset = params[:offset]
    limit = params[:limit]

    questions = team.questions.offset(offset).limit(limit)
    question_creators = questions.join(User, :creator_id => User[:id])
    agenda_items = questions.join_through(AgendaItem).join(User, :creator_id => User[:id])
    visits = questions.join_through(current_user.question_visits)
    
    render :json => build_client_dataset(questions, question_creators, agenda_items, visits)
  end
end
