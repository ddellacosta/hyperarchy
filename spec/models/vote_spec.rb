require 'spec_helper'

describe Vote do
  describe "after create or destroy" do
    attr_reader :user_1, :user_2, :meeting, :agenda_item

    before do
      @user_1 = User.make
      @user_2 = User.make
      @meeting = Meeting.make
      @agenda_item = meeting.agenda_items.make
    end

    specify "the vote count of the meeting is increment or decrement appropriately" do
      meeting.vote_count.should == 0
      ranking_1 = meeting.rankings.create(:user => user_1, :agenda_item => agenda_item, :position => 64)
      vote_1 = ranking_1.vote
      vote_1.should_not be_nil
      vote_1.meeting.should == meeting
      meeting.vote_count.should == 1

      ranking_2 = meeting.rankings.create(:user => user_2, :agenda_item => agenda_item, :position => 64)
      vote_2 = ranking_2.vote
      meeting.vote_count.should == 2

      vote_1.destroy
      meeting.vote_count.should == 1
      vote_2.destroy
      meeting.vote_count.should == 0
    end
  end
end
