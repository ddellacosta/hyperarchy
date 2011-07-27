Sham.define do
  first_name { Faker::Name.first_name }
  last_name { Faker::Name.last_name }
  email_address { Faker::Internet.email }
  meeting { Faker::Lorem.sentence.chop + "?" }
  agenda_item { Faker::Lorem.sentence }
  team_description { Faker::Company.bs.capitalize + "." }
  team_name { Faker::Company.name }
end

User.blueprint do
  first_name
  last_name
  email_address
  password { "password" }
end

Meeting.blueprint do
  body { Sham.meeting }
  team { Team.make }
  suppress_immediate_notifications { true }
  suppress_current_user_membership_check { true }
end

MeetingNote.blueprint do
  meeting { Meeting.make }
  body { Faker::Lorem.sentence }
end

AgendaItem.blueprint do
  meeting { Meeting.make }
  body { Sham.agenda_item }
  suppress_immediate_notifications { true }
  suppress_current_user_membership_check { true }
end

AgendaItemNote.blueprint do
  agenda_item { AgendaItem.make }
  body { Faker::Lorem.sentence }
  suppress_immediate_notifications { true }
  suppress_current_user_membership_check { true }
end

Ranking.blueprint do
end

Vote.blueprint do
end

Team.class_eval do
  blueprint do
    suppress_membership_creation { true }
    name { Sham.team_name }
    description { Sham.team_description }
  end

  def make_member(attributes={})
    User.make(attributes).tap do |user|
      memberships.create!(:user => user)
    end
  end

  def make_owner(attributes={})
    User.make(attributes).tap do |user|
      memberships.create!(
        :user => user,
        :role => "owner",
      )
    end
  end
end

Membership.class_eval do
  blueprint do
    user { User.make }
    team { Team.make }
  end

  attr_accessor :all_notifications

  def before_save
    return unless all_notifications
    self.notify_of_new_meetings = all_notifications
    self.notify_of_new_agenda_items = all_notifications
    self.notify_of_new_notes_on_own_agenda_items = all_notifications
    self.notify_of_new_notes_on_ranked_agenda_items = all_notifications
  end
end

