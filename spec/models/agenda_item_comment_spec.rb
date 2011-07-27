require 'spec_helper'

module Models
  describe AgendaItemComment do
    attr_reader :agenda_item, :organization, :agenda_item_creator, :comment_creator, :comment
    before do
      @organization = Organization.make
      question = organization.questions.make
      @agenda_item_creator = organization.make_member
      @comment_creator = organization.make_member
      set_current_user(comment_creator)
      @agenda_item = question.agenda_items.make(:creator => agenda_item_creator)
      @comment = agenda_item.comments.make(:creator => comment_creator)
    end
    
    describe "before create" do
      it "assigns the creator to the Model::Record.current_user" do
        set_current_user(User.make)
        organization.memberships.make(:user => current_user)
        comment = agenda_item.comments.create!(:body => "Terrible terrible agenda_item", :suppress_immediate_notifications => true)
        comment.creator.should == current_user
      end

      it "if the creator is not a member of the organization, makes them one (as long as the org is public)" do
        set_current_user(User.make)
        current_user.memberships.where(:organization => organization).should be_empty

        organization.update(:privacy => "private")
        expect do
          agenda_item.comments.create!(:body => "foo")
        end.should raise_error(SecurityError)

        organization.update(:privacy => "public")
        agenda_item.comments.create!(:body => "foo")

        current_user.memberships.where(:organization => organization).size.should == 1
      end
    end

    describe "after create" do
      it "enqueues a SendImmediateNotification job with the comment" do
        job_params = nil
        mock(Jobs::SendImmediateNotifications).create(is_a(Hash)) do |params|
          job_params = params
        end

        comment = agenda_item.comments.create!(:body => "Bullshit.")
        job_params.should ==  { :class_name => "AgendaItemComment", :id => comment.id }
      end

      it "increments the agenda_item's comment_count" do
        expect {
          agenda_item.comments.make(:creator => comment_creator)
        }.to change(agenda_item, :comment_count).by(1)
      end
    end

    describe "after destroy" do
      it "decrements the agenda_item's comment_count" do
        expect {
          comment.destroy
        }.to change(agenda_item, :comment_count).by(-1)
      end
    end

    describe "#users_to_notify_immediately" do
      it "returns the members of the agenda_item's organization who either" +
          "- have voted on the agenda_item and have :notify_of_new_comments_on_ranked_agenda_items set to 'immediately'" +
          "- created the agenda_item and have :notify_of_new_comments_on_own_agenda_items set to 'immediately'" do
        notify1 = User.make
        notify2 = User.make
        dont_notify = User.make

        notify1.rankings.create!(:agenda_item => agenda_item, :position => 64)
        notify2.rankings.create!(:agenda_item => agenda_item, :position => 64)
        dont_notify.rankings.create!(:agenda_item => agenda_item, :position => 64)
        comment_creator.rankings.create!(:agenda_item => agenda_item, :position => 64)

        organization.memberships.make(:user => notify1, :notify_of_new_comments_on_ranked_agenda_items => 'immediately')
        organization.memberships.make(:user => notify2, :notify_of_new_comments_on_ranked_agenda_items => 'immediately')
        organization.memberships.make(:user => dont_notify, :notify_of_new_comments_on_ranked_agenda_items => 'hourly')
        organization.memberships.find(:user => agenda_item_creator).update!(:notify_of_new_comments_on_own_agenda_items => 'immediately')
        organization.memberships.find(:user => comment_creator).update!(:notify_of_new_comments_on_ranked_agenda_items => 'immediately')
        comment.users_to_notify_immediately.all.should =~ [notify1, notify2, agenda_item_creator]

        organization.memberships.find(:user => agenda_item_creator).update!(:notify_of_new_comments_on_own_agenda_items => 'hourly')
        comment.users_to_notify_immediately.all.should =~ [notify1, notify2]
      end
    end

    describe "security" do
      describe "#can_create?" do
        attr_reader :comment
        before do
          @comment = agenda_item.comments.make_unsaved
        end

        context "if the organization is public" do
          before do
            organization.update(:privacy => "public")
          end

          it "returns true if the current user is not a guest" do
            set_current_user(User.default_guest)
            comment.can_create?.should be_false

            set_current_user(User.make)
            comment.can_create?.should be_true
          end
        end

        context "if the organization is not public" do
          before do
            organization.update(:privacy => "read_only")
          end

          it "returns true only if the current user is a member of the organization" do
            set_current_user(User.make)
            comment.can_create?.should be_false

            organization.memberships.make(:user => current_user)
            comment.can_create?.should be_true
          end
        end
      end
    end
  end
end