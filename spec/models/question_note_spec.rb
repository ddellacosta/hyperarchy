require 'spec_helper'

module Models
  describe QuestionNote do
    describe "#before_create" do
      it "assigns the current user as the creator" do
        set_current_user(User.make)
        note = QuestionNote.make
        note.creator.should == current_user
      end
    end
  end
end