require 'spec_helper'

describe MembershipsController do
  let(:team) { Team.make }
  let(:user) { User.make(:password => "password") }

  describe "#create" do
    context "if the membership_code is valid" do
      context "when logged in as a normal user who isn't a member of the team" do
        it "gives the user a membership to the team, if they don't already have one" do
          login_as(user)
          current_user.memberships.where(:team => team).should be_empty
          get :create, :team_id => team.id, :code => team.membership_code
          current_user.memberships.where(:team => team, :role => "member").size.should == 1
          response.should redirect_to(team_url(team))

          # a subsequent request does not create a duplicate membership
          expect do
            get :create, :team_id => team.id, :code => team.membership_code
          end.not_to change(current_user.memberships, :size)
        end
      end

      context "if the user is logged in as a guest of another team" do
        it "logs the user in as the team's special guest" do
          login_as Team.social.guest
          get :create, :team_id => team.id, :code => team.membership_code
          current_user.should == team.guest

          response.should redirect_to(team_url(team))
        end
      end

      context "if the user is not logged in" do
        it "logs the user in as the team's special guest" do
          current_user.should == User.default_guest
          get :create, :team_id => team.id, :code => team.membership_code
          current_user.should == team.guest
          response.should redirect_to(team_url(team))
        end
      end
    end

    context "if the membership_code is not valid" do
      context "if the user is logged in and has a default_team other than actionitems social" do
        it "redirects the user to their default team" do
          login_as(user)
          default_org = Team.make
          stub(user).default_team { default_org }
          get :create, :team_id => team.id, :code => "garbage"
          response.should redirect_to(team_url(default_org))
        end
      end

      context "if the user is not logged in" do
        it "redirects them to actionitems social" do
          current_user.should == User.default_guest
          get :create, :team_id => team.id, :code => "garbage"
          current_user.should == User.default_guest
          response.should redirect_to(team_url(Team.social))
        end
      end
    end
  end
end
