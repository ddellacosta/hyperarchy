_.constructor("Views.ColumnLayout.RecordDetails", View.Template, {
  content: function() {with(this.builder) {
    div({'class': _.singularize(template.tableName) + "Details"}, function() {

      div({'class': "main"}, function() {
        div({'class': "body"}).ref("body");
        div({'class': "details"}).ref("details");
        textarea({'class': "body", style: "display: none;"})
          .ref('editableBody')
          .keydown(template.keydownHandler);
        textarea({'class': "details", style: "display: none;"})
          .ref('editableDetails')
          .keydown(template.keydownHandler);

        div({'class': "creator"}, function() {
          subview('avatar', Views.Avatar, { size: 40 });
          div({'class': "name"}, "").ref('creatorName');
          div({'class': "date"}, "").ref('createdAt');
        });

        div({'class': "buttons"}, function() {
          button("Edit", {style: "display: none;"})
            .ref("editButton")
            .click("editRecord");
          button("Cancel", {style: "display: none;"})
            .ref("cancelButton")
            .click("cancelEditing");
          button("Save", {style: "display: none;"})
            .ref("saveButton")
            .click("updateRecord");
        });
      });

      ul({'class': "childLinks"}, function() {
        _(template.childNames).each(function(informalName, tableName) {
          li(function() {
            div({'class': "icon"}).ref(tableName + "LinkIcon");
            span().ref(tableName + "LinkNumber");
            raw(' ');
            span().ref(tableName + "LinkText");
          }).ref(tableName + "Link").
             click("showChildTableInNextColumn", tableName);
        }, this);
      }).ref("childLinksList");
    });
  }},

  keydownHandler: function(view, event) {
    switch (event.keyCode) {
      case 27: // escape
        view.cancelEditing();
        event.preventDefault();
        break;
      case 13: // enter
        if (event.ctrlKey) break; 
        view.updateRecord();
        event.preventDefault();
        break;
    }
  },

  // template properties to override:
  tableName: "elections",
  childNames: {
    candidates: "Answers",
    comments:   "Comments",
    votes:      "Votes"
  },
  recordConstructor: Election,
  childRelations: function(recordId) { return {
    candidates: Candidate.where({electionId: recordId}),
    comments:   ElectionComment.where({electionId: recordId}),
    votes:      Vote.where({electionId: recordId})
  }},

  viewProperties: {

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    recordId: {
      afterChange: function(id) {
        this.childRelations = this.template.childRelations(id);
        this.record(this.template.recordConstructor.find(id));
      }
    },

    selectedChildLink: {
      afterChange: function(selectedTableName) {
        _(this.childRelations).each(function(relation, tableName) {
          this[tableName + 'Link'].removeClass('selected');
        }, this);
        this[selectedTableName + 'Link'].addClass('selected');
      }
    },

    record: {
      afterChange: function(record) {
        this.body.bindHtml(record, "body");
        this.details.bindHtml(record, "details");
        var creator = User.find(record.creatorId());
        this.avatar.user(creator);
        this.creatorName.html(htmlEscape(creator.fullName()));
        this.createdAt.html(record.formattedCreatedAt());

        Server.fetch(this.childRelations).onSuccess(function() {
          this.populateChildLinks();
          this.subscribeToChildRelationChanges();
        }, this)

        if (record.editableByCurrentUser()) {
          this.editButton.show();
        } else {
          this.editButton.hide();
        }
      }
    },

    showChildTableInNextColumn: function(childTableName) {
      var newStateForNextColumn = {
        tableName:       childTableName,
        recordId:        NaN,
        parentTableName: this.template.tableName,
        parentRecordId:  this.record().id()
      };
      this.containingView.containingColumn.setNextColumnState(newStateForNextColumn);
    },

    populateChildLinks: function() {
      _(this.childRelations).each(function(relation, tableName) {
        this.updateLinkNumber(tableName);
      }, this);
    },

    subscribeToChildRelationChanges: function() {
      this.subscriptions.destroy();
      _(this.childRelations).each(function(relation, tableName) {
        this.subscriptions.add(relation.onInsert(function() {
          this.updateLinkNumber(tableName);
        }, this));
        this.subscriptions.add(relation.onRemove(function() {
          this.updateLinkNumber(tableName);
        }, this));
      }, this);
    },

    updateLinkNumber: function(tableName) {
      var relation = this.childRelations[tableName];
      var informalName = this.template.childNames[tableName];
      var linkNumber = this[tableName + "LinkNumber"];
      var linkText   = this[tableName + "LinkText"];
      var size = relation.size();
      if (size > 1) {
        linkNumber.html(size);
        linkText.html(informalName);
      } else if (size === 1) {
        linkNumber.html(1);
        linkText.html(_(informalName).singularize());
      } else {
        linkNumber.html('');
        var article = _(informalName).singularize()[0].match(/[aeiou]/) ? "an " : "a ";
        linkText.html("Add " + article + _(informalName).singularize());
      }
    },

    editRecord: function() {
      this.body.hide();
      this.details.hide();
      this.editButton.hide();
      this.editableBody.val(this.record().body());
      if (this.record().details) this.editableDetails.val(this.record().details());
      this.editableBody.show();
      this.editableDetails.show();
      this.cancelButton.show();
      this.saveButton.show();
      this.editableDetails.elastic();
      this.editableBody.elastic();
      this.editableBody.focus();
    },

    cancelEditing: function() {
      this.editableBody.hide();
      this.editableDetails.hide();
      this.body.show();
      this.details.show();
      this.saveButton.hide();
      this.cancelButton.hide();
      this.editButton.show();
    },

    updateRecord: function() {
      this.startLoading();
      this.record().update({
        body:    this.editableBody.val(),
        details: this.editableDetails.val()
      }).onSuccess(function() {
        this.stopLoading();
        this.cancelEditing();
      }, this);
    },


    startLoading: function() {

    },

    stopLoading: function() {

    }
  }
});
