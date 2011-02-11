require File.expand_path("#{File.dirname(__FILE__)}/../../hyperarchy_spec_helper")

module Models
  describe ElectionComment do
    describe "before create" do
      it "assigns the creator to the Model::Record.current_user" do
        set_current_user(User.make)
        election = Election.make
        comment = election.comments.create!(:body => "Terrible terrible election.", :suppress_notification_email => true)
        comment.creator.should == current_user
      end
    end

    describe "after create" do
      it "sends a notification email to users that have opted to receive it instantly and have either created or voted on the the comment's election" do
        opted_in_creator = User.make(:email_address => "opted_in_creator@example.com")
        opted_out_creator = User.make(:email_address => "opted_out_creator@example.com")
        opted_in_voter = User.make(:email_address => "opted_in_voter@example.com")
        opted_out_voter = User.make(:email_address => "opted_out_voter@example.com")
        opted_in_non_voter = User.make(:email_address => "opted_in_non_voter@example.com")
        comment_creator = User.make(:email_address => "comment_creator@example.com")

        organization = Organization.make
        election1 = organization.elections.make(:creator => opted_in_creator)
        election2 = organization.elections.make(:creator => opted_out_creator)

        organization.memberships.make(:user => opted_in_creator, :notify_of_new_comments_on_own_elections=> "immediately")
        organization.memberships.make(:user => opted_out_creator, :notify_of_new_comments_on_voted_elections => "never")
        organization.memberships.make(:user => opted_in_voter, :notify_of_new_comments_on_voted_elections => "immediately")
        organization.memberships.make(:user => opted_out_voter, :notify_of_new_comments_on_voted_elections => "never")
        organization.memberships.make(:user => opted_in_non_voter, :notify_of_new_comments_on_voted_elections => "immediately")
        organization.memberships.make(:user => comment_creator)

        Vote.create!(:election => election1, :user => opted_in_voter)
        Vote.create!(:election => election1, :user => opted_out_voter)

        set_current_user(comment_creator)
        comment1 = election1.comments.create!(:body => 'comment 1 body')
        comment2 = election2.comments.create!(:body => 'comment 2 body')

        Mailer.emails.length.should == 2

        creator_email = Mailer.emails.find {|email| email[:to] == opted_in_creator.email_address }
        voter_email = Mailer.emails.find {|email| email[:to] == opted_in_voter.email_address }

        creator_email[:subject].should == "1 new comment on Hyperarchy"
        creator_email[:body].should include(comment1.body)
        creator_email[:html_body].should include(comment1.body)

        voter_email[:subject].should == "1 new comment on Hyperarchy"
        voter_email[:body].should include(comment1.body)
        voter_email[:html_body].should include(comment1.body)
      end
    end
  end
end