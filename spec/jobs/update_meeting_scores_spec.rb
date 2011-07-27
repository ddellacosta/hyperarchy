require 'spec_helper'

module Jobs
  describe UpdateMeetingScores do
    let(:job) { UpdateMeetingScores.new('job_id') }

    describe "#perform" do
      it "calls Meeting.update_scores" do
        mock(Meeting).update_scores
        mock(job).completed

        job.perform
      end
    end
  end
end