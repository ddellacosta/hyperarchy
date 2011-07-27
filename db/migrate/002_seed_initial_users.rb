Sequel.migration do
  up do
    require 'bcrypt'

    self[:users] << {
      :first_name => "Admin",
      :last_name => "User",
      :email_address => "admin@actionitems.us",
      :encrypted_password => BCrypt::Password.create("changeme").to_s,
      :created_at => Time.now,
      :updated_at => Time.now,
      :guest => false,
      :admin => true,
      :email_enabled => false
    }

    self[:users] << {
      :first_name => "Default",
      :last_name => "Guest",
      :email_address => "default.guest@actionitems.us",
      :encrypted_password => BCrypt::Password.create("password").to_s,
      :created_at => Time.now,
      :updated_at => Time.now,
      :guest => true,
      :default_guest => true,
      :email_enabled => false
    }
  end

  down do
    self[:users].delete
  end
end