Sequel.migration do
  up do
    alter_table :memberships do
      add_column :notify_of_new_comments_on_own_elections, String
      add_column :notify_of_new_comments_on_voted_elections, String
    end

    execute %{
      update memberships
      set notify_of_new_comments_on_own_elections = notify_of_new_comments_on_own_candidates,
          notify_of_new_comments_on_voted_elections = notify_of_new_comments_on_ranked_candidates
    }
  end

  down do
    alter_table :memberships do
      drop_column :notify_of_new_comments_on_own_elections
      drop_column :notify_of_new_comments_on_voted_elections
    end
  end
end
