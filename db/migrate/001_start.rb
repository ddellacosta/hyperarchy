Sequel.migration do
  up do
    create_table(:agenda_item_comments) do
      primary_key :id
      String :body, :text=>true
      Integer :agenda_item_id
      Integer :creator_id
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
    end
    
    create_table(:agenda_items) do
      primary_key :id
      String :body, :size=>255
      Integer :question_id
      Integer :position
      Integer :creator_id
      String :details, :default=>"", :text=>true
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
      Integer :comment_count, :default=>0
    end
    
    create_table(:mailing_list_entries) do
      primary_key :id
      String :email_address, :text=>true
      String :comments, :text=>true
      column :created_at, 'timestamp with time zone'
    end
    
    create_table(:majorities) do
      primary_key :id
      Integer :question_id
      Integer :winner_id
      Integer :loser_id
      Integer :pro_count
      Integer :con_count
      column :winner_created_at, 'timestamp with time zone'
    end
    
    create_table(:memberships) do
      primary_key :id
      Integer :organization_id
      Integer :user_id
      String :role, :size=>255
      column :last_visited, 'timestamp with time zone'
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
      String :notify_of_new_questions, :text=>true
      String :notify_of_new_agenda_items, :text=>true
      String :notify_of_new_comments_on_own_agenda_items, :text=>true
      String :notify_of_new_comments_on_ranked_agenda_items, :text=>true
      TrueClass :has_participated, :default=>false
    end
    
    create_table(:organizations) do
      primary_key :id
      String :name, :size=>255
      String :description, :size=>255
      TrueClass :dismissed_welcome_guide, :default=>false
      TrueClass :members_can_invite, :default=>false
      TrueClass :use_ssl, :default=>true
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
      Integer :question_count, :default=>0
      TrueClass :social, :default=>false
      String :privacy, :default=>"private", :text=>true
      String :membership_code, :text=>true
      Integer :member_count, :default=>0
    end
    
    create_table(:question_comments) do
      primary_key :id
      String :body, :text=>true
      Integer :question_id
      Integer :creator_id
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
    end
    
    create_table(:question_visits) do
      primary_key :id
      Integer :question_id
      Integer :user_id
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
    end
    
    create_table(:questions) do
      primary_key :id
      Integer :organization_id
      String :body, :text=>true
      column :updated_at, 'timestamp with time zone'
      column :created_at, 'timestamp with time zone'
      Integer :creator_id
      Integer :vote_count, :default=>0
      Float :score
      String :details, :text=>true
    end
    
    create_table(:rankings) do
      primary_key :id
      Integer :user_id
      Integer :question_id
      Integer :agenda_item_id
      Float :position
      Integer :vote_id
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
    end
    
    create_table(:shares) do
      primary_key :id
      String :code, :text=>true, :null=>false
      Integer :user_id, :null=>false
      Integer :question_id, :null=>false
      column :created_at, 'timestamp with time zone', :null=>false
      String :service, :text=>true, :null=>false
    end
    
    create_table(:users, :ignore_index_errors=>true) do
      primary_key :id
      String :first_name, :size=>255
      String :last_name, :size=>255
      String :email_address, :size=>255
      String :encrypted_password, :size=>255
      TrueClass :dismissed_welcome_blurb
      TrueClass :admin, :default=>false
      TrueClass :dismissed_welcome_guide, :default=>false
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
      String :password_reset_token, :text=>true
      column :password_reset_token_generated_at, 'timestamp with time zone'
      TrueClass :guest, :default=>false
      TrueClass :email_enabled, :default=>true
      TrueClass :default_guest, :default=>false
      String :facebook_id, :text=>true
      Integer :twitter_id
      Integer :referring_share_id
      
      index [:twitter_id], :name=>:users_twitter_id_key, :unique=>true
    end
    
    create_table(:votes) do
      primary_key :id
      Integer :question_id
      Integer :user_id
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
    end
  end
  
  down do
    drop_table(:agenda_item_comments, :agenda_items, :mailing_list_entries, :majorities, :memberships, :organizations, :question_comments, :question_visits, :questions, :rankings, :schema_info, :shares, :users, :votes)
  end
end
