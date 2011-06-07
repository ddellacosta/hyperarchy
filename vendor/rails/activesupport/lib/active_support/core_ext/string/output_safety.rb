require 'erb'
require 'active_support/core_ext/kernel/singleton_class'

class ERB
  module Util
    HTML_ESCAPE = { '&' => '&amp;',  '>' => '&gt;',   '<' => '&lt;', '"' => '&quot;' }
    JSON_ESCAPE = { '&' => '\u0026', '>' => '\u003E', '<' => '\u003C' }

    # A utility method for escaping HTML tag characters.
    # This method is also aliased as <tt>h</tt>.
    #
    # In your ERB templates, use this method to escape any unsafe content. For example:
    #   <%=h @person.name %>
    #
    # ==== Example:
    #   puts html_escape("is a > 0 & a < 10?")
    #   # => is a &gt; 0 &amp; a &lt; 10?
    def html_escape(s)
      s = s.to_s
      if s.html_safe?
        s
      else
        s.gsub(/[&"><]/) { |special| HTML_ESCAPE[special] }.html_safe
      end
    end

    # Aliasing twice issues a warning "discarding old...". Remove first to avoid it.
    remove_method(:h)
    alias h html_escape

    module_function :h

    singleton_class.send(:remove_method, :html_escape)
    module_function :html_escape

    # A utility method for escaping HTML entities in JSON strings
    # using \uXXXX JavaScript escape sequences for string literals:
    #
    #   json_escape("is a > 0 & a < 10?")
    #   # => is a \u003E 0 \u0026 a \u003C 10?
    #
    # Note that after this operation is performed the output is not
    # valid JSON. In particular double quotes are removed:
    #
    #   json_escape('{"name":"john","created_at":"2010-04-28T01:39:31Z","id":1}')
    #   # => {name:john,created_at:2010-04-28T01:39:31Z,id:1}
    #
    # This method is also aliased as +j+, and available as a helper
    # in Rails templates:
    #
    #   <%=j @person.to_json %>
    #
    def json_escape(s)
      s.to_s.gsub(/[&"><]/) { |special| JSON_ESCAPE[special] }
    end

    alias j json_escape
    module_function :j
    module_function :json_escape
  end
end

class Object
  def html_safe?
    false
  end
end

class Fixnum
  def html_safe?
    true
  end
end

module ActiveSupport #:nodoc:
  class SafeBuffer < String
    alias safe_concat concat

    def concat(value)
      if value.html_safe?
        super(value)
      else
        super(ERB::Util.h(value))
      end
    end
    alias << concat

    def +(other)
      dup.concat(other)
    end

    def html_safe?
      true
    end

    def html_safe
      self
    end

    def to_s
      self
    end

    def encode_with(coder)
      coder.represent_scalar nil, to_str
    end

    def to_yaml(*args)
      return super() if defined?(YAML::ENGINE) && !YAML::ENGINE.syck?

      to_str.to_yaml(*args)
    end
  end
end

class String
  def html_safe!
    raise "You can't call html_safe! on a String"
  end

  def html_safe
    ActiveSupport::SafeBuffer.new(self)
  end
end