Sequel.migration do
  up do
    alter_table :elections do
      set_column_type :body, String, :text => true
    end
  end

  down do
    alter_table :elections do
      set_column_type :body, String, :text => false
    end
  end
end

