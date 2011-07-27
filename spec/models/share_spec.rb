require 'spec_helper'

describe Share do
  describe "before create" do
    attr_reader :user_1, :user_2, :meeting, :agenda_item

    before do
      set_current_user(User.make)
    end

    it "assigns the user to the current user" do
      share = Share.create!(:meeting_id => 1, :code => "randomcode", :service => "facebook")
      share.user.should == current_user
    end

    it "requires the service to be twitter or facebook" do
      expect {
        Share.create!(:meeting_id => 1, :code => "randomcode", :service => "twitbook")
      }.to raise_error
    end
  end
end
