require "spec_helper"

describe NotificationMailer do
  attr_reader :org1, :org1_e1, :org1_e1_c1, :org1_e1_c1_note, :org1_e1_c2, :org1_e2, :org1_e2_c1,
              :org1_e2_c1_note, :org2, :org2_e1, :org2_e1_c1, :org2_e1_c1_note,
              :user, :membership1, :membership2, :email

  before do
    set_current_user(User.make)

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

    stub(user).memberships_to_notify { [membership1, membership2] }

    mock(membership1).new_meetings_in_period('hourly') { [org1_e1] }
    mock(membership1).new_agenda_items_in_period('hourly') { [org1_e1_c1, org1_e2_c1] }
    mock(membership1).new_notes_on_ranked_agenda_items_in_period('hourly') { [org1_e1_c1_note, org1_e2_c1_note ] }
    mock(membership1).new_notes_on_own_agenda_items_in_period('hourly') { [] }

    mock(membership2).new_meetings_in_period('hourly') { [] }
    mock(membership2).new_agenda_items_in_period('hourly') { [] }
    mock(membership2).new_notes_on_ranked_agenda_items_in_period('hourly') { [] }
    mock(membership2).new_notes_on_own_agenda_items_in_period('hourly') { [org2_e1_c1_note] }

    presenter = Views::NotificationMailer::NotificationPresenter.new(user, 'hourly')

    @email = NotificationMailer.notification(user, presenter)
  end

  describe "#notification" do
    it "is from admin@actionitems.us, to the user's email address" do
      email.from.should == ["admin@actionitems.us"]
      email.to.should == [user.email_address]
    end

    it "gives counts for each new item in the subject" do
      email.subject.should == "1 new meeting, 2 new agenda_items, and 3 new notes on Actionitems"
    end

    it "includes all meetings, agenda_items, and notes that are new for the notification period" do
      expect_all_content_present(email.text_part.body)
      expect_all_content_present(email.html_part.body)
    end

    def expect_all_content_present(email_part_body)
      email_part_body.should include(org1.name)
      email_part_body.should include(org1_e1.body)
      email_part_body.should include(org1_e1_c1.body)
      email_part_body.should include(org1_e1_c1_note.body)
      email_part_body.should include(org1_e2.body)
      email_part_body.should include(org1_e2_c1.body)
      email_part_body.should include(org1_e2_c1_note.body)

      email_part_body.should include(org2.name)
      email_part_body.should include(org2_e1.body)
      email_part_body.should include(org2_e1_c1.body)
      email_part_body.should include(org2_e1_c1_note.body)
    end
  end
end
