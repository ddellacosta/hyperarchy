class QuestionVisit < Prequel::Record
  column :id, :integer
  column :question_id, :integer
  column :user_id, :integer
  column :created_at, :datetime
  column :updated_at, :datetime

  belongs_to :question
  belongs_to :user

  def team_ids
    question ? question.team_ids : []
  end
end
