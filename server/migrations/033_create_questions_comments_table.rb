Sequel.migration do
  up do
    create_table :election_comments do
      primary_key :id
      String :body
      Integer :election_id
      Integer :creator_id
      column :created_at, 'timestamp with time zone'
      column :updated_at, 'timestamp with time zone'
    end
  end

  down do
    drop_table :election_comments
  end
end
