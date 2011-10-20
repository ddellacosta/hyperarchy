//= require old_monarch/view/template
//= require old_monarch/view/builder
//= require old_monarch/view/history
//= require old_monarch/view/open_tag
//= require old_monarch/view/close_tag
//= require old_monarch/view/self_closing_tag
//= require old_monarch/view/text_node

(function(Monarch) {

_.module("Monarch.View", {
  build: function(contentFn) {
    return Monarch.View.Template.build(contentFn);
  }
});

})(Monarch);
