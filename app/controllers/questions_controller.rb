class QuestionsController < ApplicationController
  def index
    organization = Organization.find(params[:organization_id])
    raise SecurityError unless organization.current_user_can_read?

    offset = params[:offset]
    limit = params[:limit]

    questions = organization.questions.offset(offset).limit(limit)
    question_creators = questions.join(User, :creator_id => User[:id])
    answers = questions.join_through(Answer).join(User, :creator_id => User[:id])
    visits = questions.join_through(current_user.question_visits)
    
    render :json => build_client_dataset(questions, question_creators, answers, visits)
  end
end