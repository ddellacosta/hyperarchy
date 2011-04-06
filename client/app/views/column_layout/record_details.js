_.constructor("Views.ColumnLayout.RecordDetails", View.Template, {

  // template properties to override:
  recordConstructor: Election,
  tableName: "elections",
  childRelations: function(recordId) { return {
    candidates: Candidate.where({electionId: recordId}),
    comments:   ElectionComment.where({electionId: recordId}),
    votes:      Vote.where({electionId: recordId})
  }},
  childNames: {
    candidates: "Answers",
    comments:   "Comments",
    votes:      "Votes"
  },
  //

  content: function() {with(this.builder) {
    div({'class': _.singularize(template.tableName) + " recordDetails"}, function() {

        p({'class': "body"}).ref("body");
        div({'class': "details contracted"}, function() {
          span({'class': ""}).ref("details");
        }).ref('detailsContainer');
        span("...", {'class': "ellipsis", style: "display: none;"})
          .ref("detailsEllipsis")
        textarea({'class': "body", style: "display: none;"})
          .ref('editableBody')
          .keydown(template.keydownHandler);
        textarea({'class': "details", style: "display: none;", placeholder: "Further details"})
          .ref('editableDetails')
          .keydown(template.keydownHandler);

      div({'class': "footer"}, function() {
        button("More", {style: "display: none;"})
          .ref("expandButton")
          .click("expandDetails");
        button("Less", {style: "display: none;"})
          .ref("contractButton")
          .click("contractDetails");
        button("Edit", {style: "display: none;"})
          .ref("editButton")
          .click("enableEditing");
        button("Save", {style: "display: none;"})
          .ref("saveButton")
          .click("updateRecord");
        button("Cancel", {style: "display: none;"})
          .ref("cancelButton")
          .click("disableEditing");

        subview('avatar', Views.Avatar, { size: 40 });
        span({'class': "name"}, "").ref('creatorName');
        br();
        span({'class': "date"}, "").ref('createdAt');

        div({'class': "clear"});
      });

      ul({'class': "childLinks"}, function() {
        _(template.childNames).each(function(informalName, tableName) {
          li(function() {
            div({'class': "icon"}).ref(tableName + "LinkIcon");
            span().ref(tableName + "LinkNumber");
            raw(' ');
            span().ref(tableName + "LinkText");
          }).ref(tableName + "Link").click("showChildTable", tableName);
        }, this);
      }).ref("childLinksList");

    });
  }},

  keydownHandler: function(view, event) {
    switch (event.keyCode) {
      case 27: // escape
        view.disableEditing();
        event.preventDefault();
        break;
      case 13: // enter
        if (event.ctrlKey) break;
        view.updateRecord();
        event.preventDefault();
        break;
    }
  },

  viewProperties: {

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle;
    },

    recordId: {
      afterChange: function(recordId) {
        this.record(this.template.recordConstructor.find(recordId));
        this.childRelations = this.template.childRelations(recordId);
        Server.fetch(this.childRelations).onSuccess(function() {
          this.populateChildLinks();
          this.subscribeToChildRelationChanges();
        }, this)
      }
    },

    record: {
      afterChange: function(record) {
        this.body.bindHtml(record, "body");
        this.details.bindHtml(record, "details");
        this.editableBody.val(record.body());
        this.editableDetails.val(record.details());

        this.editableDetails.elastic();
        this.editableBody.elastic();
        if (record.editableByCurrentUser()) this.editButton.show();
        this.showOrHideExpandButton();

        var creator = User.find(record.creatorId());
        this.avatar.user(creator);
        this.creatorName.html(htmlEscape(creator.fullName()));
        this.createdAt.html(record.formattedCreatedAt());
      }
    },

    selectedChildLink: {
      afterChange: function(selectedTableName) {
        _(this.childRelations).each(function(relation, tableName) {
          this[tableName + 'Link'].removeClass('selected');
        }, this);
//        this[selectedTableName + 'Link'].addClass('selected');
      }
    },

    showChildTable: function(tableName) {
      this.containingView.containingColumn.pushNextState({
        tableName: tableName
      });
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

    expandDetails: function() {
      this.detailsContainer.removeClass("contracted");
      this.expandButton.hide();
      this.contractButton.show();
      this.detailsEllipsis.hide();
    },

    contractDetails: function() {
      this.detailsContainer.addClass("contracted");
      this.contractButton.hide();
      this.saveButton.hide();
      this.cancelButton.hide();
      this.editButton.show();
      this.showOrHideExpandButton();
    },

    enableEditing: function() {
      this.editableBody.val(this.record().body());
      this.editableDetails.val(this.record().details());
      this.body.hide();
      this.detailsContainer.hide();
      this.detailsEllipsis.hide();
      this.editableBody.show();
      this.editableDetails.show();
      this.editButton.hide();
      this.expandButton.hide();
      this.contractButton.hide();
      this.cancelButton.show();
      this.saveButton.show();
      this.editableBody.focus();
    },

    disableEditing: function() {
      this.editableBody.hide();
      this.editableDetails.hide();
      this.body.show();
      this.detailsContainer.show();
      this.contractDetails();
    },

    showOrHideExpandButton: function() {
      if (this.details.height() > this.detailsContainer.height()) {
        this.detailsEllipsis.show();
        this.expandButton.show();
      } else {
        this.expandButton.hide();
        this.detailsEllipsis.hide();
      }
    },

    updateRecord: function() {
      this.startLoading();
      this.record().update({
        body:    this.editableBody.val(),
        details: this.editableDetails.val()
      }).onSuccess(function() {
        this.stopLoading();
        this.disableEditing();
      }, this);
    },

    startLoading: function() {

    },

    stopLoading: function() {

    }
  }
});
