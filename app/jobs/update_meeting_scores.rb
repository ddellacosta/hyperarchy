module Jobs
  class UpdateMeetingScores < Resque::JobWithStatus
    @queue = 'update_meeting_scores'

    def perform
      Meeting.update_scores
      completed
    end
  end
end
