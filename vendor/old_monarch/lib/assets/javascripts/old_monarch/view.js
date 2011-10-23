//= require old_monarch/view/template
//= require old_monarch/view/builder
//= require old_monarch/view/history
//= require old_monarch/view/open_tag
//= require old_monarch/view/close_tag
//= require old_monarch/view/self_closing_tag
//= require old_monarch/view/text_node

(function(OldMonarch) {

_.module("OldMonarch.View", {
  build: function(contentFn) {
    return OldMonarch.View.Template.build(contentFn);
  }
});

})(OldMonarch);
