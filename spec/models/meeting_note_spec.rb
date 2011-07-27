require 'spec_helper'

module Models
  describe MeetingNote do
    describe "#before_create" do
      it "assigns the current user as the creator" do
        set_current_user(User.make)
        note = MeetingNote.make
        note.creator.should == current_user
      end
    end
  end
end