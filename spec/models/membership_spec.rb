require 'spec_helper'

module Models
  describe Membership do
    attr_reader :team, :user
    before do
      @team = Team.make
      @user = set_current_user(User.make)
    end

    describe "before create" do
      it "assigns last_visited to the current time" do
        freeze_time
        freeze_time
        membership = team.memberships.make(:user => User.make)
        membership.last_visited.should == Time.now
      end
    end

    describe "security" do
      describe "#can_create?, #can_update?, #can_destroy?" do
        it "only allows admins, team owners to modify memberships. the members themselves can update only the last_visited and email preferences columns" do
          team = Team.make
          member = team.make_member
          owner = team.make_owner
          admin = User.make(:admin => true)
          other_user = User.make

          new_membership = team.memberships.new(:user => other_user)
          membership = team.memberships.find(:user => member)

          set_current_user(member)
          new_membership.can_create?.should be_false
          membership.can_update?.should be_true
          membership.can_destroy?.should be_false
          membership.can_update_columns?([:role, :notify_of_new_questions, :notify_of_new_agenda_items]).should be_false
          membership.can_update_columns?([:last_visited]).should be_true

          set_current_user(owner)
          new_membership.can_create?.should be_true
          membership.can_update?.should be_true
          membership.can_destroy?.should be_true

          set_current_user(admin)
          new_membership.can_create?.should be_true
          membership.can_update?.should be_true
          membership.can_destroy?.should be_true
        end
      end
    end

    describe "methods supporting notifications" do
      let(:membership) { team.memberships.make(:user => user) }
      let(:other_user) { team.make_member }
      let(:time_of_notification) { freeze_time }

      describe "#last_notified_or_visited_at(period)" do
        describe "when the last_visited time is later than 1 period ago" do
          it "returns the time of the last visit" do
            membership.last_visited = Time.now
            membership.send(:last_notified_or_visited_at, "hourly").should == membership.last_visited
          end
        end

        describe "when the last_visited time is earlier than 1 period ago" do
          it "returns 1 period ago" do
            freeze_time
            membership.last_visited = 3.hours.ago
            membership.send(:last_notified_or_visited_at, "hourly").should == 1.hour.ago
          end
        end

        describe "when the last_visited time is nil" do
          it "returns 1 period ago, without raising an execptio" do
            freeze_time
            membership.last_visited = nil
            membership.send(:last_notified_or_visited_at, "hourly").should == 1.hour.ago
          end
        end
      end
    end
  end
end
