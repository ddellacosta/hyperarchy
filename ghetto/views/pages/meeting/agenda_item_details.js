_.constructor('Views.Pages.Meeting.AgendaItemDetails', Monarch.View.Template, {
  content: function(params) { with(this.builder) {
    div({id: "agendaItem-details"}, function() {
      div({'class': "non-editable"}, function() {
        div({'class': "body"}).ref("body");
        span({'class': "details"}).ref("details");
        span({'class': "details"}).ref("expandedDetails");
        a({'class': "more link"}, "more ↓").
          ref("moreLink").
          click(function() {
            this.expanded(true);
          });
        a({'class': "less link"}, "less ↑ ").
          ref("lessLink").
          click(function() {
            this.expanded(false);
          });
        div({'class': "clear"}).ref('detailsClearDiv');
        a({'class': "edit"}, "✎ edit").ref('editButton').click('edit');
        a({'class': "destroy"}, "✕ delete").ref('destroyButton').click('destroy');
      }).ref('nonEditableContent');

      form(function() {
        textarea({name: "body", 'class': "body", tabindex: 201}).ref("editableBody");
        subview('charsRemaining', Views.Components.CharsRemaining, {limit: 140});
        label({'for': "details"}, "Further Details");
        textarea({name: 'details', 'class': "details", tabindex: 202}).ref("editableDetails");
      }).submit('update')
        .ref('form');
      a({'class': 'update button', tabindex: 203}, "Save").ref('updateButton').click('update');
      a({'class': 'cancel button', tabindex: 204}, "Cancel").ref('cancelEditButton').click('cancelEdit');
      a({'class': 'create button'}, "Add AgendaItem").ref('createButton').click('create');

      div({'class': "creator"}, function() {
        subview('avatar', Views.Components.Avatar, {imageSize: params.fullScreen ? 46 : 34});
        div({'class': "name"}).ref('creatorName');
        div({'class': "date"}).ref('createdAt');
      }).ref('creator');

      subview('notes', Views.Pages.Meeting.Notes, { fullScreen: params.fullScreen });
    });
  }},

  viewProperties: {
    attach: function($super) {
      Application.onCurrentUserChange(this.hitch('showOrHideMutateButtons'));
      $super();
      $(window).resize(this.hitch('adjustNotesHeight'));
      this.editableBody.elastic();
      this.editableDetails.elastic();
      this.editableBody.bind('elastic', this.hitch('adjustNotesHeight'));
      this.charsRemaining.field(this.editableBody);
      this.editableDetails.bind('elastic', this.hitch('adjustNotesHeight'));
      this.editableBody.bind('keydown', 'return', this.bind(function() {
        this.find(".create:visible, .update:visible").click();
        return false;
      }));
    },

    agendaItem: {
      change: function(agendaItem) {
        if (!agendaItem) return;
        this.body.bindMarkdown(agendaItem, 'body');
        this.avatar.user(agendaItem.creator());
        this.creatorName.bindText(agendaItem.creator(), 'fullName');
        this.createdAt.text(agendaItem.formattedCreatedAt());
        this.showOrHideMutateButtons();

        agendaItem.trackView();

        this.registerInterest(agendaItem, 'onDestroy', function() {
          History.pushState(null, null, agendaItem.meeting().url());
        });
        this.registerInterest(agendaItem, 'onUpdate', this.hitch('handleAgendaItemUpdate'));
        this.handleAgendaItemUpdate();
        this.expanded(false);
      },

      write: function(agendaItem) {
        this.cancelEdit();
      }
    },

    create: function() {
      if ($.trim(this.editableBody.val()) === '') return;

      var fieldValues = this.form.fieldValues();
      Application.promptSignup().success(function() {
        this.parentView.meeting().agendaItems().create(fieldValues).success(function(agendaItem) {
          agendaItem.trackCreate();
        });
        History.pushState(null, null, this.parentView.meeting().url());
      }, this);
      return false;
    },

    update: function(e) {
      e.preventDefault();
      if ($.trim(this.editableBody.val()) === '') return;
      if (this.editableBody.val().length > 140) return;
      this.agendaItem().update(this.form.fieldValues()).success(this.bind(function(agendaItem) {
        agendaItem.trackUpdate();
        this.cancelEdit();
      }));
    },

    destroy: function() {
      if (window.confirm("Are you sure you want to delete this agendaItem?")) {
        this.agendaItem().destroy();
      }
    },

    edit: function() {
      this.expanded(true);
      this.nonEditableContent.hide();
      this.form.show();
      this.updateButton.show();
      this.cancelEditButton.show();
      if (this.agendaItem()) {
        this.editableBody.val(this.agendaItem().body()).keyup();
        this.editableDetails.val(this.agendaItem().details()).keyup();
      }

      this.editableBody.focus();
      this.adjustNotesHeight();
    },

    showNewForm: function() {
      this.notes.hide();
      this.edit();
      this.editableBody.val('');
      this.editableBody.keyup();
      this.editableDetails.val('');
      this.cancelEditButton.hide();
      this.updateButton.hide();
      this.createButton.show();
      this.avatar.user(Application.currentUser());
      this.creatorName.text(Application.currentUser().fullName());
      return this.createdAt.text($.PHPDate("M j, Y @ g:ia", new Date()));
    },

    cancelEdit: function() {
      this.expanded(false);
      this.nonEditableContent.show();
      if (!this.notes.loading()) this.notes.show();
      this.form.hide();
      this.updateButton.hide();
      this.cancelEditButton.hide();
      this.createButton.hide();
      this.adjustNotesHeight();
    },

    showOrHideMutateButtons: function() {
      if (this.agendaItem() && this.agendaItem().editableByCurrentUser()) {
        this.addClass('mutable');
      } else {
        this.removeClass('mutable');
      }
    },

    expanded: {
      change: function(isExpanded) {
        this.notes.expanded(isExpanded);
        if (isExpanded) {
          this.addClass('expanded');
          this.details.hide();
          this.expandedDetails.show();
          this.lessLink.show();
          this.moreLink.hide();
        } else {
          this.removeClass('expanded');
          this.expandedDetails.hide();
          this.details.show();
          this.lessLink.hide();
          this.scrollTop(0);
          this.showOrHideMoreButton();
          this.adjustNotesHeight();
        }
      }
    },

    showOrHideMoreButton: function() {
      if (this.shouldShowMoreLink()) {
        this.moreLink.show();
      } else {
        this.moreLink.hide();
      }
    },

    shouldShowMoreLink: function() {
      if (this.expanded()) return false;
      if (!(this.agendaItem() && this.agendaItem().details())) return false;

      return this.agendaItem().details().length > this.maxDetailsLength;
    },

    truncate: function(string, maxChars) {
      if (string.length < maxChars) {
        return string
      } else {
        var lastSpacePosition = string.lastIndexOf(" ", maxChars);
        return string.substring(0, lastSpacePosition) + "…";
      }
    },

    maxDetailsLength: 200,

    handleAgendaItemUpdate: function() {
      var agendaItem = this.agendaItem();
      this.details.markdown(this.truncate(agendaItem.details() || "", this.maxDetailsLength));
      this.expandedDetails.markdown(agendaItem.details());
      if (agendaItem.details()) {
        this.detailsClearDiv.show();
      } else {
        this.detailsClearDiv.hide();
      }
      this.showOrHideMoreButton();
      this.adjustNotesHeight();
    },

    adjustNotesHeight: function() {
      if (this.expanded()) return;
      this.notes.fillVerticalSpace(this);
    },

    loading: function(loading) {
      return this.notes.loading.apply(this.notes, arguments);
    },

    scrollToBottom: function() {
      console.log(this.height(), this.attr('scrollHeight'));
      this.scrollTop(this.attr('scrollHeight') - this.height());
    }
  }
});
