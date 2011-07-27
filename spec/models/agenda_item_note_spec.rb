require 'spec_helper'

module Models
  describe AgendaItemNote do
    attr_reader :agenda_item, :team, :agenda_item_creator, :note_creator, :note
    before do
      @team = Team.make
      meeting = team.meetings.make
      @agenda_item_creator = team.make_member
      @note_creator = team.make_member
      set_current_user(note_creator)
      @agenda_item = meeting.agenda_items.make(:creator => agenda_item_creator)
      @note = agenda_item.notes.make(:creator => note_creator)
    end
    
    describe "before create" do
      it "assigns the creator to the Model::Record.current_user" do
        set_current_user(User.make)
        team.memberships.make(:user => current_user)
        note = agenda_item.notes.create!(:body => "Terrible terrible agenda_item", :suppress_immediate_notifications => true)
        note.creator.should == current_user
      end

      it "if the creator is not a member of the team, makes them one (as long as the org is public)" do
        set_current_user(User.make)
        current_user.memberships.where(:team => team).should be_empty

        team.update(:privacy => "private")
        expect do
          agenda_item.notes.create!(:body => "foo")
        end.should raise_error(SecurityError)

        team.update(:privacy => "public")
        agenda_item.notes.create!(:body => "foo")

        current_user.memberships.where(:team => team).size.should == 1
      end
    end

    describe "after create" do
      it "enqueues a SendImmediateNotification job with the note" do
        job_params = nil
        mock(Jobs::SendImmediateNotifications).create(is_a(Hash)) do |params|
          job_params = params
        end

        note = agenda_item.notes.create!(:body => "Bullshit.")
        job_params.should ==  { :class_name => "AgendaItemNote", :id => note.id }
      end

      it "increments the agenda_item's note_count" do
        expect {
          agenda_item.notes.make(:creator => note_creator)
        }.to change(agenda_item, :note_count).by(1)
      end
    end

    describe "after destroy" do
      it "decrements the agenda_item's note_count" do
        expect {
          note.destroy
        }.to change(agenda_item, :note_count).by(-1)
      end
    end

    describe "#users_to_notify_immediately" do
      it "returns the members of the agenda_item's team who either" +
          "- have voted on the agenda_item and have :notify_of_new_notes_on_ranked_agenda_items set to 'immediately'" +
          "- created the agenda_item and have :notify_of_new_notes_on_own_agenda_items set to 'immediately'" do
        notify1 = User.make
        notify2 = User.make
        dont_notify = User.make

        notify1.rankings.create!(:agenda_item => agenda_item, :position => 64)
        notify2.rankings.create!(:agenda_item => agenda_item, :position => 64)
        dont_notify.rankings.create!(:agenda_item => agenda_item, :position => 64)
        note_creator.rankings.create!(:agenda_item => agenda_item, :position => 64)

        team.memberships.make(:user => notify1, :notify_of_new_notes_on_ranked_agenda_items => 'immediately')
        team.memberships.make(:user => notify2, :notify_of_new_notes_on_ranked_agenda_items => 'immediately')
        team.memberships.make(:user => dont_notify, :notify_of_new_notes_on_ranked_agenda_items => 'hourly')
        team.memberships.find(:user => agenda_item_creator).update!(:notify_of_new_notes_on_own_agenda_items => 'immediately')
        team.memberships.find(:user => note_creator).update!(:notify_of_new_notes_on_ranked_agenda_items => 'immediately')
        note.users_to_notify_immediately.all.should =~ [notify1, notify2, agenda_item_creator]

        team.memberships.find(:user => agenda_item_creator).update!(:notify_of_new_notes_on_own_agenda_items => 'hourly')
        note.users_to_notify_immediately.all.should =~ [notify1, notify2]
      end
    end

    describe "security" do
      describe "#can_create?" do
        attr_reader :note
        before do
          @note = agenda_item.notes.make_unsaved
        end

        context "if the team is public" do
          before do
            team.update(:privacy => "public")
          end

          it "returns true if the current user is not a guest" do
            set_current_user(User.default_guest)
            note.can_create?.should be_false

            set_current_user(User.make)
            note.can_create?.should be_true
          end
        end

        context "if the team is not public" do
          before do
            team.update(:privacy => "read_only")
          end

          it "returns true only if the current user is a member of the team" do
            set_current_user(User.make)
            note.can_create?.should be_false

            team.memberships.make(:user => current_user)
            note.can_create?.should be_true
          end
        end
      end
    end
  end
end