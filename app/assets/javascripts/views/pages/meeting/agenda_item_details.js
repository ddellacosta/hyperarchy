_.constructor('Views.Pages.Meeting.AgendaItemDetails', Monarch.View.Template, {
  content: function(params) { with(this.builder) {
    div({id: "agenda-item-details"}, function() {
      a({'class': "edit"}, "✎ edit").ref('editButton').click('edit');
      a({'class': "destroy"}, "✕ delete").ref('destroyButton').click('destroy');

      form(function() {
        textarea({name: "body", 'class': "body", tabindex: 201}).ref("editableBody");
        subview('charsRemaining', Views.Components.CharsRemaining, {limit: 140});
      }).submit('update')
        .ref('form');

      a({'class': 'update button', tabindex: 203}, "Save").ref('updateButton').click('update');
      a({'class': 'cancel button', tabindex: 204}, "Cancel").ref('cancelEditButton').click('cancelEdit');
      a({'class': 'create button'}, "Add Agenda Item").ref('createButton').click('create');

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
      this.editableBody.bind('elastic', this.hitch('adjustNotesHeight'));
      this.charsRemaining.field(this.editableBody);
      this.editableBody.bind('keydown', 'return', this.bind(function() {
        this.find(".create:visible, .update:visible").click();
        return false;
      }));
    },

    agendaItem: {
      change: function(agendaItem) {
        if (!agendaItem) return;
        this.avatar.user(agendaItem.creator());
        this.creatorName.bindText(agendaItem.creator(), 'fullName');
        this.createdAt.text(agendaItem.formattedCreatedAt());
        this.showOrHideMutateButtons();

        agendaItem.trackView();

        this.registerInterest(agendaItem, 'onDestroy', function() {
          History.pushState(null, null, agendaItem.meeting().url());
        });
      },

      write: function() {
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
      if (window.confirm("Are you sure you want to delete this agenda item?")) {
        this.agendaItem().destroy();
      }
    },

    edit: function() {
      this.removeClass('mutable');
      this.form.show();
      this.updateButton.show();
      this.cancelEditButton.show();
      if (this.agendaItem()) {
        this.editableBody.val(this.agendaItem().body()).keyup();
      }

      this.editableBody.focus();
      this.adjustNotesHeight();
    },

    showNewForm: function() {
      this.notes.hide();
      this.edit();
      this.editableBody.val('');
      this.editableBody.keyup();
      this.cancelEditButton.hide();
      this.updateButton.hide();
      this.createButton.show();
      this.avatar.user(Application.currentUser());
      this.creatorName.text(Application.currentUser().fullName());
      return this.createdAt.text($.PHPDate("M j, Y @ g:ia", new Date()));
    },

    cancelEdit: function() {
      if (!this.notes.loading()) this.notes.show();
      this.form.hide();
      this.updateButton.hide();
      this.cancelEditButton.hide();
      this.createButton.hide();
      this.showOrHideMutateButtons();
      this.adjustNotesHeight();
    },

    showOrHideMutateButtons: function() {
      if (this.agendaItem() && this.agendaItem().editableByCurrentUser()) {
        this.addClass('mutable');
      } else {
        this.removeClass('mutable');
      }
    },

    adjustNotesHeight: function() {
      this.notes.fillVerticalSpace(this);
    },

    loading: function(loading) {
      return this.notes.loading.apply(this.notes, arguments);
    }
  }
});
