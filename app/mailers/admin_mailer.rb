class AdminMailer < ActionMailer::Base
  default :from => "Actionitems Admin <admin@actionitems.us>"

  def notify_addresses
    ['max@actionitems.us', 'nathan@actionitems.us']
  end

  def feedback(user, feedback)
    mail :to => notify_addresses,
         :subject => "#{user.full_name} has submitted feedback",
         :body => "#{user.full_name}\n#{user.email_address}\n\n#{feedback}"
  end

  def new_user(user)
    mail :to => ['max@actionitems.us', 'nathan@actionitems.us'],
         :subject => "New user on #{Rails.env}",
         :body => "#{user.full_name}\n#{user.email_address}\n"
  end
end
