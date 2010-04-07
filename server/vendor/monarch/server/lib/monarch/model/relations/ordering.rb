module Model
  module Relations
    class Ordering < Relation
      attr_reader :operand, :sort_specifications
      delegate :column, :surface_tables, :build_record_from_database, :sql_set_quantifier, :sql_select_list,
               :sql_from_table_ref, :sql_where_clause_predicates,
               :to => :operand

      def initialize(operand, sort_specifications, &block)
        super(&block)
        @operand, @sort_specifications = operand, convert_to_sort_specifications_if_needed(sort_specifications)
      end

      def ==(other)
        return false unless other.instance_of?(self.class)
        operand == other.operand && sort_specifications == other.sort_specifications
      end

      def sql_sort_specifications
        sort_specifications.map {|sort_spec| sort_spec.sql_sort_specification}
      end

      protected
      def convert_to_sort_specifications_if_needed(columns_or_sort_specs)
        columns_or_sort_specs.map do |column_or_sort_spec|
          if column_or_sort_spec.instance_of?(Expressions::SortSpecification)
            column_or_sort_spec
          else
            Expressions::SortSpecification(column_or_sort_spec, :asc)
          end
        end
      end
    end
  end
end