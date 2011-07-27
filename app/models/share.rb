class Share < Prequel::Record
  column :id, :integer
  column :code, :string
  column :service, :string
  column :user_id, :integer
  column :meeting_id, :integer
  column :created_at, :datetime

  belongs_to :user
  belongs_to :meeting

  def before_create
    raise "Service must be twitter or facebook" unless service =~ /^(twitter|facebook)$/
    self.user_id ||= current_user.id
  end
end