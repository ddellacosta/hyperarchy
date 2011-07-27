require 'spec_helper'

describe Team do
  describe "security" do
    describe "#can_create?" do
      it "does not allow guests to create" do
        team = Team.make_unsaved
        set_current_user(User.default_guest)
        team.can_create?.should be_false

        set_current_user(User.make)
        team.can_create?.should be_true
      end
    end

    describe "#can_update? and #can_destroy" do
      it "only allows admins and owners to update or destroy the team" do
        team = Team.make
        non_member = User.make
        admin = User.make(:admin => true)
        member = team.make_member
        owner = team.make_owner

        set_current_user(non_member)
        team.can_update?.should be_false
        team.can_destroy?.should be_false

        set_current_user(member)
        team.can_update?.should be_false
        team.can_destroy?.should be_false

        set_current_user(owner)
        team.can_update?.should be_true
        team.can_destroy?.should be_true

        set_current_user(admin)
        team.can_update?.should be_true
        team.can_destroy?.should be_true
      end
    end

    describe "#before_create" do
      it "populates the #membership_code with a random string" do
        team = Team.make
        team.membership_code.should_not be_nil
      end
    end

    describe "#after_create" do
      it "creates a special guest with a membership to the team and to actionitems social" do
        team = Team.make
        special_guest = team.guest
        special_guest.should_not be_nil
        special_guest.teams.all.should =~ [team, Team.social]
      end
    end

    describe "#ensure_current_user_is_member" do
      attr_reader :team

      context "if the team is public" do
        before do
          @team = Team.make(:privacy => 'public')
        end

        context "if the current user is not a member" do
          before do
            set_current_user(User.make)
          end

          it "creates a membership for them" do
            current_user.memberships.where(:team => team).should be_empty
            team.ensure_current_user_is_member
            current_user.memberships.where(:team => team).count.should == 1
          end
        end

        context "if the current user is a member" do
          before do
            set_current_user(team.make_member)
          end

          it "does not create another membership for them" do
            expect do
              team.ensure_current_user_is_member
            end.to_not change { current_user.memberships.where(:team => team).count }
          end
        end
      end

      context "if the team is not public" do
        before do
          @team = Team.make(:privacy => 'private')
        end

        context "if the current user is a confirmed member" do
          before do
            set_current_user(team.make_member)
          end

          it "does not raise an exception" do
            team.ensure_current_user_is_member
          end
        end

        context "if the current user is not a member" do
          before do
            set_current_user(User.make)
          end

          it "raises a security exception" do
            expect do
              team.ensure_current_user_is_member
            end.to raise_error(SecurityError)
          end
        end
      end
    end

    describe "#guest" do
      context "for Actionitems Social" do
        it "returns the guest who is ONLY a member of Actionitems Social" do
          org = Team.make
          guest = Team.social.guest
          guest.should_not == org.guest
          guest.should be_guest
          guest.memberships.find(:team => Team.social).should be
        end
      end

      context "for another private org" do
        it "returns that team's guest" do
          org = Team.make
          guest = org.guest
          guest.should be_guest
          guest.should_not == Team.social.guest
          guest.memberships.find(:team => org).should be
        end
      end
    end
  end
end
