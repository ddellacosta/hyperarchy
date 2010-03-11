FIXTURES = {
  :sessions => {
    :nathan_session => {
      :session_id => "nathan_session",
      :user_id => "nathan"
    }
  },

  :users => {
    :nathan => {
      :full_name => "Nathan Sobo",
      :email_address => "nathansobo@example.com",
      :encrypted_password => User.encrypt_password("password")
    }
  },

  :organizations => {
    :meta => {
      :name => "Meta Hyperarchy"  
    },
    :restaurunt => {
      :name => "Restaurant"
    }
  },

  :elections => {
    :bottleneck => {
      :organization_id => "meta",
      :body => "What's our biggest bottleneck?"
    }
  }
}
