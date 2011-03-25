Sequel.migration do
  up do
    add_column(:elections, :details, String, :default => "")
  end

  down do
    drop_column(:elections, :details)
  end
end
