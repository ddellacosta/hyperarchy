require 'spec_helper'

describe MeetingVisitsController do
  describe "#create" do

    let(:meeting) { Meeting.make }

    context "for a normal user" do
      before do
        login_as meeting.team.make_member
      end

      context "when the meeting has never been visited" do
        it "creates an meeting visit record for the current user and meeting and returns the visit record" do
          current_user.meeting_visits.where(:meeting => meeting).should be_empty
          post :create, :meeting_id => meeting.to_param
          response.should be_success
          visit = current_user.meeting_visits.find(:meeting => meeting)
          visit.should_not be_nil

          response_json['meeting_visits'].should have_key(visit.to_param)
        end
      end

      context "when the meeting has already been visited" do
        it "updates the visited_at time on the meeting visit record to the current time and returns the visit record" do
          freeze_time
          existing_visit = current_user.meeting_visits.create!(:meeting => meeting)
          jump 10.minutes
          post :create, :meeting_id => meeting.to_param
          response.should be_success
          existing_visit.updated_at.to_i.should == Time.now.to_i

          response_json['meeting_visits'].should have_key(existing_visit.to_param)
        end
      end
    end

    context "for a guest user" do
      it "does not create an meeting visit" do
        MeetingVisit.should be_empty
        post :create, :meeting_id => meeting.to_param
        MeetingVisit.should be_empty
      end
    end
  end
end
