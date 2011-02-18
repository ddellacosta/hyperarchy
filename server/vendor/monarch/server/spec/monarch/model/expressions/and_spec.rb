require File.expand_path("#{File.dirname(__FILE__)}/../../../monarch_spec_helper")

module Monarch
  module Model
    module Expressions
      describe And do
        describe "class methods" do
          describe ".from_wire_representation" do
            attr_reader :wire_representation, :repository

            before do
              @wire_representation = {
                "type" => "and",
                "operands" => [
                  {
                    "type" => "eq",
                    "left_operand" => { "type" => "scalar", "value" => 1},
                    "right_operand" => { "type" => "scalar", "value" => 1}
                  },
                  {
                    "type" => "eq",
                    "left_operand" => {
                      "type" => "column",
                      "table" => "super_blog_posts",
                      "name" => "body"
                    },
                    "right_operand" => { "type" => "scalar", "value" => "General Mao" }
                  },
                ]
              }
              @repository = UserRepository.new(User.find('jan'))
            end

            it "returns and And expression conjoining the converted operands" do
              pred = And.from_wire_representation(wire_representation, repository)
              pred.should be_an_instance_of(And)

              pred.operands[0].should be_an_instance_of(Eq)
              pred.operands[0].left_operand.should == 1
              pred.operands[0].right_operand.should == 1

              pred.operands[1].should be_an_instance_of(Eq)
              pred.operands[1].left_operand.should == repository.get_view(:super_blog_posts).column(:body)
              pred.operands[1].right_operand.should == "General Mao"
            end
          end
        end


        describe "#force_matching_field_values" do
          it "constructs a hash by merging the results of #force_matching_field_values on its operands" do
            pred = And.new([BlogPost[:body].eq("Settlers of catan is fun"), BlogPost[:title].eq("Settlers")])
            pred.force_matching_field_values(:bar => "baz", :body => "No!!").should == { :body => "Settlers of catan is fun", :title => "Settlers", :bar => "baz"}
          end
        end
      end
    end
  end
end