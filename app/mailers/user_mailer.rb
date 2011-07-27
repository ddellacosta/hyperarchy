class UserMailer < ActionMailer::Base
  default :from => "Actionitems <admin@actionitems.us>"

  def password_reset(user)
    @user = user
    mail :to => user.email_address,
         :subject => "Reset your Actionitems password"
  end
end
