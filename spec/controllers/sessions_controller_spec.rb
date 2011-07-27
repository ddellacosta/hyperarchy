require 'spec_helper'

describe SessionsController do
  let(:team) { Team.make }
  let(:user) { User.make(:password => "password") }

  describe "#create" do
    context "when the email address and password match an existing user" do
      context "when logged in as the default guest" do
        attr_reader :membership
        before { @membership = team.memberships.make(:user => user) }

        it "logs the user in, and returns the current user id plus the user's initial dataset" do
          current_user.should == User.default_guest
          xhr :post, :create, :user => { :email_address => user.email_address, :password => "password" }
          Prequel.session.current_user.should == user
          current_user.should == user

          response.should be_success
          response_json["data"].should == { "current_user_id" => user.id }

          response_records.should include(user.initial_repository_contents)
        end
      end


      context "when logged in as a special guest" do
        it "creates a membership on the guest's team for the user who logs in" do
          login_as team.guest

          user.should_not be_member_of(team)
          xhr :post, :create, :user => { :email_address => user.email_address, :password => "password" }
          current_user.should == user

          membership = user.memberships.find(:team => team)
          membership.should be

          response_records.should include(membership)
        end
      end
    end

    describe "when the email address does not match an existing user" do
      it "does not set a current user and returns error messages" do
        current_user.should == User.default_guest
        xhr :post, :create, :user => { :email_address => "garbage", :password => "password" }
        current_user.should == User.default_guest

        response.status.should == 422
        response_json.should_not be_empty
      end
    end

    describe "when the password does not match an existing user" do
      it "does not set a current user and returns error messages" do
        current_user.should == User.default_guest
        xhr :post, :create, :user => { :email_address => user.email_address, :password => "garbage" }
        current_user.should == User.default_guest

        response.status.should == 422
        response_json.should_not be_empty
      end
    end
  end

  describe "#destroy" do
    it "logs the current user out and returns the initial repository contents of the default guest" do
      login_as(user)
      mock(Prequel.session).current_user = user # this happens before the log out
      mock(Prequel.session).current_user = nil # this should happen upon log out
      current_user.should_not be_nil
      post :destroy
      response.should be_success
      current_user.should == User.default_guest

      response_json['data'].should == { 'current_user_id' => User.default_guest.id }
      response_records.should include(current_user.initial_repository_contents)
    end
  end
end
