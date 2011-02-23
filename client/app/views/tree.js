_.constructor("Views.Tree", View.Template, {
  content: function() { with(this.builder) {
    div({id: "tree"}, function() {

      subview("column0", Views.TreeColumn);
      subview("column1", Views.TreeColumn);
      subview("column2", Views.TreeColumn);

      div({style: "clear: both;"});

    }).ref("tree");
  }},

  viewProperties: {
    viewName: 'tree',

    MAXCOLUMNS: 3,

    tablesByName: {
      root : {
        organizations: Organization,
        elections:     Election,
        candidates:    Candidate
      },
      organizations: {
        elections: Election
      },
      elections: {
        candidates: Candidate,
        comments:   ElectionComment
      },
      candidates: {
        comments:   CandidateComment
      }
    },

    initialize: function() {
      this.tableNames = [];
      this.relations  = [];
      this.ids        = [];
      this.subscriptions = new Monarch.SubscriptionBundle();
    },

    navigate: function(state) {
      this.setRelationsFromUrl(state);
      this.setCurrentOrganization();
      this.assignRelationsToColumns();

      Application.layout.activateNavigationTab("questionsLink");
      Application.layout.hideSubNavigationContent();
    },

    numColumns: {
      afterChange: function(numColumns) {
        if (this.numColumns < 2) {
          // less than two valid columns given. take some corrective action.
          console.debug("invalid hash fragment");
        }
      }
    },

    setRelationsFromUrl: function(state) {
      var tables = [], parentName = "root";
      for (var i = 0; i < this.MAXCOLUMNS; i++) {
        this.ids[i]        = parseInt(state["id" + i]);
        this.tableNames[i] = state["table" + i];
        tables[i]  = this.tablesByName[parentName][this.tableNames[i]];
        parentName = this.tableNames[i];
        if (!tables[i] || !this.ids[i]) break;
      }

      this.numColumns( _(tables).compact().length );
      this.relations[0] = tables[0].where({id: this.ids[0]});
      for (var i = 1; i < this.numColumns(); i++) {
        this.relations[i] = this.relations[i-1].joinThrough(tables[i]);
      }
    },

    assignRelationsToColumns: function() {
      for (var i = 0; i < this.numColumns; i++) {
        this["column" + i].state({
          "tableName": this.tableNames[i],
          "relation":  this.relations[i],
          "id":        this.ids[i]
        });
      }
    },

    setCurrentOrganization: function() {
      if (this.tableNames[0] == "organizations") {
        Application.currentOrganizationId(this.ids[0]);
      } else {
        this.relations[0].fetch().onSuccess(function() {
          Application.currentOrganizationId(this.relations[0].first().organizationId());
        }, this);
      }
    }
  }
});
