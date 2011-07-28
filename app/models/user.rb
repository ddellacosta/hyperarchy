class User < Prequel::Record
  column :id, :integer
  column :first_name, :string
  column :last_name, :string
  column :email_address, :string
  column :encrypted_password, :string
  column :email_enabled, :boolean, :default => true
  column :admin, :boolean
  column :password_reset_token, :string
  column :password_reset_token_generated_at, :datetime
  column :guest, :boolean, :default => false
  column :default_guest, :boolean, :default => false
  column :facebook_id, :string
  column :twitter_id, :integer
  column :referring_share_id, :integer
  synthetic_column :email_hash, :string

  has_many :memberships
  has_many :meeting_visits
  has_many :votes
  has_many :rankings
  has_many :meetings
  has_many :agenda_items, :foreign_key => :creator_id
  belongs_to :referring_share, :class_name => "Share"

  def teams
    memberships.join_through(Team)
  end

  def owned_teams
    memberships.where(:role => "owner").join_through(Team)
  end

  validates_uniqueness_of :email_address, :message => "There is already an account with that email address."

  def self.encrypt_password(unencrypted_password)
    BCrypt::Password.create(unencrypted_password).to_s
  end

  def self.users_to_notify(period)
    Membership.where_any(
      :notify_of_new_meetings => period,
      :notify_of_new_agenda_items => period,
      :notify_of_new_notes_on_own_agenda_items => period,
      :notify_of_new_notes_on_ranked_agenda_items => period
    ).join_through(User).where(:guest => false, :email_enabled => true).distinct
  end

  def self.default_guest
    find(:default_guest => true)
  end

  def self.create_guest(team_id)
    self.create!(:guest => true,
                 :first_name => "Guest",
                 :last_name  => "User#{team_id}",
                 :email_address => "guest#{team_id}@actionitems.us",
                 :email_enabled => false,
                 :password => "guest_password")
  end

  def can_update_or_destroy?
    current_user.admin? || current_user == self
  end
  alias can_update? can_update_or_destroy?
  alias can_destroy? can_update_or_destroy?

  def create_whitelist
    [:first_name, :last_name, :email_address, :password]
  end 

  def update_whitelist
    list = [:first_name, :last_name, :email_address, :email_enabled]
    list.push(:admin) if current_user.admin?
    list
  end

  # dont send email address to another user unless they are an admin or owner
  def read_blacklist
    if current_user_can_read_email_address?
      [:encrypted_password]
    else
      [:email_address, :encrypted_password]
    end
  end

  def current_user_can_read_email_address?
    return false unless current_user
    self == current_user || current_user.admin? || current_user.owns_team_with_member?(self)
  end

  def owns_team_with_member?(user)
    !owned_teams.join_through(user.memberships).empty?
  end

  def after_create
    run_later do
      AdminMailer.new_user(self).deliver
    end
  end

  def team_ids
    memberships.map(&:team_id)
  end

  def initial_repository_contents
    [self] + memberships.all  + initial_repository_teams.all
  end

  def initial_repository_teams
    if admin?
      Team.table
    else
      teams | Team.where(Team[:privacy].neq('private'))
    end
  end

  def password=(unencrypted_password)
    return nil if unencrypted_password.blank?
    self.encrypted_password = self.class.encrypt_password(unencrypted_password)
  end

  def password
    return nil if encrypted_password.blank?
    BCrypt::Password.new(encrypted_password)
  end

  def generate_password_reset_token
    update!(
      :password_reset_token => SecureRandom.hex(8),
      :password_reset_token_generated_at => Time.now
    )
  end

  def email_hash
    Digest::MD5.hexdigest(email_address.downcase) if email_address
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def validate
    errors.add(:first_name, "You must enter a first name.") if first_name.blank?

    unless twitter_id
      errors.add(:last_name, "You must enter a last name.") if last_name.blank?
      errors.add(:email_address, "You must enter an email address.") if email_address.blank?
    end

    unless twitter_id || facebook_id
      if encrypted_password.blank?
        errors.add(:password, "You must enter a password.")
      end
    end
  end

  def default_team
    if memberships.empty?
      Team.find(:social => true)
    else
      memberships.order_by(Membership[:last_visited].desc).first.team
    end
  end

  def guest_team
    return nil unless guest?
    teams.find(:social => false)
  end

  def memberships_to_notify(period)
    memberships.
      join(Team).
      order_by(:social.desc).
      project(Membership).
      all.
      select {|m| m.wants_notifications?(period)}
  end

  def member_of?(team)
    !memberships.where(:team => team).empty?
  end

  def associate_referring_share(share_code)
    update!(:referring_share => Share.find(:code => share_code))
  end
end
