_.constructor("Views.ColumnLayout.RecordDetails", View.Template, {

  // template properties to override:
  recordConstructor: Election,
  tableName: "elections",
  childNames: {
    candidates: "Answers",
    votes:      "Votes"
  },
  childRelations: function(recordId) { return {
    comments:   ElectionComment.where({electionId: recordId}),
    candidates: Candidate.where({electionId: recordId}),
  }},

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
          .ref("updateButton")
          .click("updateRecord");
        button("Save", {style: "display: none;"})
          .ref("createButton")
          .click("createRecord");
        button("Cancel", {style: "display: none;"})
          .ref("cancelButton")
          .click("disableEditing");

        subview('avatar', Views.Avatar, { size: 40 });
        span({'class': "name"}, "").ref('creatorName');
        br();
        span({'class': "date"}, "").ref('createdAt');

        div({'class': "clear"});
      });

      if (template.childRelations(0).comments) {
        div({'class': "comments"}, function() {
          div({'class': "header"}, function() {
            span().ref("commentsHeaderNumber");
            raw(' ');
            span().ref("commentsHeaderText");
          });
          subview('commentsList', Views.SortedList, {
            buildElement: function(comment) {
              return Views.ColumnLayout.CommentLi.toView({comment: comment})
            }
          });
          textarea({'class': "comment", placeholder: "Write a comment"}).
            ref('editableComment').
            keydown(template.keydownHandler);
          button("Add Comment").
            ref("commentSaveButton").
            click("createComment");
          div({'class': "clear"});
        });
      }

      ul({'class': "childLinks"}, function() {
        _.each(template.childNames, function(informalName, tableName) {
          if (tableName !== "comments") {
            li(function() {
              div({'class': "icon"}).ref(tableName + "LinkIcon");
              span().ref(tableName + "LinkNumber");
              raw(' ');
              span().ref(tableName + "LinkText");
            }).ref(tableName + "Link").click("showChildTable", tableName);
          }
        }, this);
      }).ref("childLinksList");

      div({'class': "loading"}).ref("loading");
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
        view.saveEdits();
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
        if (recordId === "new") {
          this.newRecord();
          return;
        }

        recordId = parseInt(recordId);
        this.subscriptions.destroy();
        this.record(this.template.recordConstructor.find(recordId));
        this.childRelations = this.template.childRelations(recordId);
        Server.fetch(_.values(this.childRelations)).onSuccess(function() {
          if (this.commentsList) this.commentsList.relation(this.childRelations.comments);
          this.populateChildRelations();
          this.subscribeToChildRelationChanges();
        }, this)
      }
    },

    selectedChildTableName: {
      afterChange: function(selectedTableName) {
        _.each(this.childRelations, function(relation, tableName) {
          if (this[tableName + 'Link']) this[tableName + 'Link'].removeClass('selected');
        }, this);
        if (this[selectedTableName + 'Link']) this[selectedTableName + 'Link'].addClass('selected');
      }
    },

    // private

    record: {
      afterWrite: function(record) {
        this.disableEditing();
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
        this.childLinksList.show();
      }
    },

    showChildTable: function(tableName) {
      this.containingView.containingColumn.pushNextState({tableName: tableName});
    },

    populateChildRelations: function() {
      _.each(this.childRelations, function(relation, tableName) {
        this.updateLinkNumber(tableName);
      }, this);
    },

    subscribeToChildRelationChanges: function() {
      _.each(this.childRelations, function(relation, tableName) {
        this.subscriptions.add(relation.onInsert(function() {
          this.updateLinkNumber(tableName);
        }, this));
        this.subscriptions.add(relation.onRemove(function() {
          this.updateLinkNumber(tableName);
        }, this));
      }, this);
    },

    updateLinkNumber: function(tableName) {
      var relation     = this.childRelations[tableName];
      var informalName = this.template.childNames[tableName];
      var number, text;
      if (tableName === "comments") {
        number = this['commentsHeaderNumber'];
        text   = this['commentsHeaderText'];
      } else {
        number = this[tableName + "LinkNumber"];
        text   = this[tableName + "LinkText"];
      }
      var size = relation.size();
      if (size > 1) {
        number.html(size);
        text.html(informalName);
      } else if (size === 1) {
        number.html(1);
        text.html(_.singularize(informalName));
      } else {
        number.html('');
        var indefiniteArticle = informalName.match(/^[aeiou]/) ? "an " : "a ";
        text.html("Add " + indefiniteArticle + _.singularize(informalName));
      }
    },

    newRecord: function() {
      this.editableBody.val("");
      this.editableDetails.val("");
      this.editableDetails.elastic();
      this.editableBody.elastic();
      this.showOrHideExpandButton();

      var creator = User.find(Application.currentUserId);
      this.avatar.user(creator);
      this.creatorName.html(htmlEscape(creator.fullName()));
      this.createdAt.html("");

      this.childLinksList.hide();
      this.enableCreating();
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
      this.updateButton.hide();
      this.createButton.hide();
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
      this.createButton.hide();
      this.updateButton.show();
      this.editableBody.focus();
    },

    enableCreating: function() {
      this.body.hide();
      this.detailsContainer.hide();
      this.detailsEllipsis.hide();
      this.editableBody.show();
      this.editableDetails.show();
      this.editButton.hide();
      this.expandButton.hide();
      this.contractButton.hide();
      this.cancelButton.show();
      this.updateButton.hide();
      this.createButton.show();
      this.defer(this.bind(function() {this.editableBody.focus()}));
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

    createRecord: function() {
      Application.currentOrganization().ensureCurrentUserCanParticipate().
        onSuccess(function() {
          this.containingView.unrankedList.relation().create({
            body:    this.editableBody.val(),
            details: this.editableDetails.val()
          }).onSuccess(function(newRecord) {
            this.containingView.containingColumn.pushState({recordId: newRecord.id()});
            this.disableEditing();
          }, this);
        }, this);
    },

    createComment: function() {
      Application.currentOrganization().ensureCurrentUserCanParticipate().
        onSuccess(function() {
          this.childRelations.comments.create({
            body: this.editableComment.val()
          }).onSuccess(function(newRecord) {
            this.editableComment.val('');
          }, this);
        }, this);
    },

    saveEdits: function() {
      if (this.createButton.is(':visible'))      this.createButton.click();
      else if (this.updateButton.is(':visible')) this.updateButton.click();
    },

    startLoading: function() {
    },

    stopLoading: function() {
    }
  }
});
