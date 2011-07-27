require 'spec_helper'

module Views
  module NotificationMailer
    describe NotificationPresenter do
      describe "when presenting a periodic notification" do
        attr_reader :org1, :org1_e1, :org1_e1_c1, :org1_e1_c1_note, :org1_e1_c2, :org1_e2, :org1_e2_c1,
                    :org1_e2_c1_note, :org2, :org2_e1, :org2_e1_c1, :org2_e1_c1_note,
                    :user, :membership1, :membership2

        before do
          @org1 = Team.make(:name => "Org 1")
          @org1_e1 = org1.meetings.make(:body => "Org 1 Meeting 1")
          @org1_e1_c1 = org1_e1.agenda_items.make(:body => "Org 1 Meeting 1 AgendaItem 1")
          @org1_e1_c1_note = org1_e1_c1.notes.make(:body => "Org 1 Meeting 1 AgendaItem 1 Note")
          @org1_e1_c2 = org1_e1.agenda_items.make(:body => "Org 1 Meeting 1 AgendaItem 2")
          @org1_e2 = org1.meetings.make(:body => "Org 1 Meeting 2")
          @org1_e2_c1 = org1_e2.agenda_items.make(:body => "Org 1 Meeting 2 AgendaItem 1")
          @org1_e2_c1_note = org1_e2_c1.notes.make(:body => "Org 1 Meeting 2 AgendaItem 1 Note")

          @org2 = Team.make(:name => "Org 2")
          @org2_e1 = org2.meetings.make(:body => "Org 2 Meeting 1")
          @org2_e1_c1 = org2_e1.agenda_items.make(:body => "Org 2 Meeting 1 AgendaItem 1")
          @org2_e1_c1_note = org2_e1_c1.notes.make(:body => "Org 2 Meeting 1 AgendaItem 1 Note")

          @user = User.make
          @membership1 = org1.memberships.make(:user => user, :all_notifications => 'hourly')
          @membership2 = org2.memberships.make(:user => user, :all_notifications => 'hourly')

          mock(user).memberships_to_notify('hourly') { [membership1, membership2] }

          mock(membership1).new_meetings_in_period('hourly') { [org1_e1] }
          mock(membership1).new_agenda_items_in_period('hourly') { [org1_e1_c1, org1_e2_c1] }
          mock(membership1).new_notes_on_ranked_agenda_items_in_period('hourly') { [org1_e1_c1_note, org1_e2_c1_note ] }
          mock(membership1).new_notes_on_own_agenda_items_in_period('hourly') { [] }

          mock(membership2).new_meetings_in_period('hourly') { [] }
          mock(membership2).new_agenda_items_in_period('hourly') { [] }
          mock(membership2).new_notes_on_ranked_agenda_items_in_period('hourly') { [] }
          mock(membership2).new_notes_on_own_agenda_items_in_period('hourly') { [org2_e1_c1_note] }
        end

        it "for each of the user's memberships appropriate for the notification period, hierarchically organizes the meetings, agenda_items, and notes" do
          presenter = NotificationPresenter.new(user, 'hourly')

          presenter.membership_presenters.size.should == 2

          membership1_presenter = presenter.membership_presenters[0]
          membership1_presenter.membership.should == membership1

          membership1_presenter.meeting_presenters.size.should == 2

          org1_e1_presenter = membership1_presenter.meeting_presenters.find {|ep| ep.meeting == org1_e1}
          org1_e1_presenter.agenda_item_presenters.size.should == 2

          org1_e1_c1_presenter = org1_e1_presenter.agenda_item_presenters.find {|cp| cp.agenda_item == org1_e1_c1}
          org1_e1_c1_presenter.new_notes.should == [org1_e1_c1_note]

          org1_e1_c2_presenter = org1_e1_presenter.agenda_item_presenters.find {|cp| cp.agenda_item == org1_e1_c2}
          org1_e1_c2_presenter.new_notes.should be_empty

          membership2_presenter = presenter.membership_presenters[1]
          membership2_presenter.meeting_presenters.size.should == 1
          org2_e1_presenter = membership2_presenter.meeting_presenters.first
          org2_e1_presenter.agenda_item_presenters.size.should == 1
          org2_e1_c1_presenter = org2_e1_presenter.agenda_item_presenters.first
          org2_e1_c1_presenter.new_notes.should == [org2_e1_c1_note]
        end
      end

      describe "when presenting an immediate notification" do
        let(:team) { Team.make }
        let(:user) { team.make_member }
        let(:presenter) { NotificationPresenter.new(user, 'immediately', item) }
        let(:meeting) { team.meetings.make }
        let(:agenda_item) { meeting.agenda_items.make }
        let(:agenda_item_note) { agenda_item.notes.make }


        describe "when notifying of an meeting" do
          let(:item) { meeting }

          it "includes the note in the meeting hierarchy of objects" do
            presenter.membership_presenters.size.should == 1
            membership_presenter = presenter.membership_presenters.first
            membership_presenter.membership.team.should == team
            membership_presenter.membership.user.should == user
            membership_presenter.meeting_presenters.size.should == 1
            membership_presenter.meeting_presenters.first.meeting.should == meeting
          end
        end

        describe "when notifying of a agenda_item" do
          let(:item) { agenda_item }

          it "includes the note in the agenda_item hierarchy of objects" do
            presenter.membership_presenters.size.should == 1
            membership_presenter = presenter.membership_presenters.first
            membership_presenter.membership.team.should == team
            membership_presenter.membership.user.should == user
            membership_presenter.meeting_presenters.size.should == 1
            meeting_presenter = membership_presenter.meeting_presenters.first
            meeting_presenter.meeting.should == meeting
            meeting_presenter.agenda_item_presenters.size.should == 1
            meeting_presenter.agenda_item_presenters.first.agenda_item.should == agenda_item
          end
        end

        describe "when notifying of a agenda_item note" do
          let(:item) { agenda_item_note }

          it "includes the note in the correct hierarchy of objects" do
            presenter.membership_presenters.size.should == 1
            membership_presenter = presenter.membership_presenters.first
            membership_presenter.membership.team.should == team
            membership_presenter.membership.user.should == user
            membership_presenter.meeting_presenters.size.should == 1
            meeting_presenter = membership_presenter.meeting_presenters.first
            meeting_presenter.meeting.should == meeting
            meeting_presenter.agenda_item_presenters.size.should == 1
            agenda_item_presenter = meeting_presenter.agenda_item_presenters.first
            agenda_item_presenter.agenda_item.should == agenda_item
            agenda_item_presenter.new_notes.size.should == 1
            agenda_item_presenter.new_notes.first.should == agenda_item_note
          end
        end
      end
    end
  end
end