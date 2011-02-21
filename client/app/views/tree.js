_.constructor("Views.Tree", View.Template, {
  content: function() { with(this.builder) {
    div({id: "tree"}, function() {

      div({id: "leftColumn", 'class': "column"}, function() {
        h2().ref("leftColumnTitle");
      }).ref("leftColumn");

      div({id: "rightColumn", 'class': "column"}, function() {
        subview('rightRelationList', Views.SortedList, {
          rootAttributes: {id: "rightRelationList"},
          buildElement: function(record) {
            return record.body();
          }
        });
      }).ref("rightColumn");

    });
  }},

  viewProperties: {
    viewName: 'tree',

    initialize: function() {
      this.subscriptions = new Monarch.SubscriptionBundle();
    },

    navigate: function(state) {
      this.parseHash(state);
      this.fetchLeftRecord();
      this.fetchRightRelations();

      Application.layout.activateNavigationTab("questionsLink");
      Application.layout.hideSubNavigationContent();
    },

    fetchLeftRecord: function() {
      this.leftConstructor.findOrFetch(this.leftId).
        onSuccess(function(record) {
          this.leftRecord(record);
        }, this);
    },

    fetchRightRelations: function() {
      var childConstructors = this.viewableTables[this.leftConstructorName].children;
      _(childConstructors).each(function(childConstructor) {
        var relation = this.leftConstructor.where({id: this.leftId}).joinThrough(childConstructor);
        relation.fetch().onSuccess(function() {
          if (childConstructor === this.rightConstructor) {
            this.rightRelation(relation);
          }
        }, this);
      }, this);
    },

    leftRecord: {
      afterChange: function(record) {
        Application.currentOrganizationId(record.organizationId());
        this.populateLeftColumn();
      }
    },

    rightRelation: {
      afterChange: function() {
        this.populateRightColumn();
      }
    },

    populateLeftColumn: function() {
      this.leftColumnTitle.bindHtml(this.leftRecord(), "body");
    },

    populateRightColumn: function() {
      this.rightRelationList.relation(this.rightRelation());
    },

    parseHash: function(state) {
      this.leftId = parseInt(state.id);
      this.leftConstructorName  = state.left.toLowerCase();
      this.rightConstructorName = _(state.right.toLowerCase()).singularize();
      this.leftConstructor  = this.viewableTables[this.leftConstructorName].constructor;
      this.rightConstructor = this.viewableTables[this.leftConstructorName].children[this.rightConstructorName];

      if (!this.leftConstructor || !this.rightConstructor) {
        // take some corrective action here
        console.debug("invalid hash fragment");
      }
    },

    viewableTables: {
      "organization": {
        "constructor": Organization,
        "children": {
          "election": Election
        }},

      "election": {
        "constructor": Election,
        "children": {
          "candidate": Candidate,
          "comment":   ElectionComment
        }},

      "candidate": {
        "constructor": Candidate,
        "children": {
          "comment": CandidateComment
        }}
    }
  }
});
