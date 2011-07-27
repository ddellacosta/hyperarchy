require 'spec_helper'

describe Sandbox do

  attr_reader :question, :repository, :user_1, :user_2, :agenda_item_1, :agenda_item_2

  before do
    org = Organization.make
    current_user = org.make_member

    @user_1 = org.make_member
    @user_2 = org.make_member

    @question = org.questions.make
    @agenda_item_1 = question.agenda_items.make(:creator => user_1)
    @agenda_item_2 = question.agenda_items.make(:creator => user_2)

    @repository = Sandbox.new(current_user)
  end

  it "correctly interprets a join from agenda_items on a given question to their users" do
    wire_reps = [
      {"type" => "inner_join",
       "left_operand" =>
        {"type" => "selection",
         "operand" => {"type" => "table", "name" => "agenda_items"},
         "predicate" =>
          {"type" => "eq",
           "left_operand" => {"type" => "column", "table" => "agenda_items", "name" => "question_id"},
           "right_operand" => {"type" => "scalar", "value" => question.id}}},
       "right_operand" => {"type" => "table", "name" => "users"},
       "predicate" =>
        {"type" => "eq",
         "left_operand" => {"type" => "column", "table" => "agenda_items", "name" => "creator_id"},
         "right_operand" => {"type" => "column", "table" => "users", "name" => "id"}}}
    ]

    dataset = repository.fetch(*wire_reps)
    dataset["users"].should have_key(user_1.to_param)
    dataset["users"].should have_key(user_2.to_param)
    dataset["agenda_items"].should have_key(agenda_item_1.to_param)
    dataset["agenda_items"].should have_key(agenda_item_2.to_param)
  end
end

