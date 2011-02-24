_.constructor("Views.Tree.Layout", View.Template, {
  content: function() { with(this.builder) {
    div({id: "tree"}, function() {

    }).ref("tree");
  }},

  viewProperties: {
    viewName: 'tree',

    initialize: function() {
      this.MAXCOLUMNS = 4;
      this.columns    = [];
      this.tableNames = [];
      this.relations  = [];
      this.recordIds  = [];
      for (var i = 0; i < this.MAXCOLUMNS; i++) {
        this.append(this.columns[i] = Views.Tree.Column.toView());
      }
    },

    navigate: function(state) {
      this.getRelationsFromUrl(state);
      this.setCurrentOrganization();
      this.assignRelationsToColumns();

      Application.layout.activateNavigationTab("questionsLink");
      Application.layout.hideSubNavigationContent();
    },

    getRelationsFromUrl: function(state) {
      var tables = [], parentName = "root";
      for (var i = 0; i < this.MAXCOLUMNS; i++) {
        this.tableNames[i] = state["table" + (i+1)];
        this.recordIds[i]  = parseInt(state["id" + (i+1)]);
        tables[i]  = this.tablesByName[parentName][this.tableNames[i]];
        parentName = this.tableNames[i];
        if (!tables[i] || !this.recordIds[i]) break;
      }
      this.numColumns(_(tables).compact().length);
      this.relations[0] = tables[0].where({id: this.recordIds[0]});
      for (var i = 1; i < this.numColumns(); i++) {
        this.relations[i] = this.relations[i-1].where({id: this.recordIds[i-1]}).joinThrough(tables[i]);
      }
    },

    assignRelationsToColumns: function() {
      for (var i = 0; i < this.numColumns(); i++) {
        this.columns[i].state({
          tableName: this.tableNames[i],
          relation:  this.relations[i],
          recordId:  this.recordIds[i]
        });
      }
    },

    setCurrentOrganization: function() {
      if (this.tableNames[0] == "organizations") {
        Application.currentOrganizationId(this.recordIds[0]);
      } else {
        this.relations[0].fetch().onSuccess(function() {
          Application.currentOrganizationId(
            this.relations[0].first().organizationId());
        }, this);
      }
    },

    numColumns: {
      afterChange: function(numColumns) {
        if (numColumns < 2) {
          // less than two valid columns given. take some corrective action.
          console.debug("invalid hash fragment");
        }
        this.arrangeColumns();
      }
    },

    arrangeColumns: function() {
      _(this.columns).each(function(column, i) {
        column.body.width((98 / this.numColumns()) + "%");
        if (i < this.numColumns()) column.show();
        else column.hide();
      }, this);
    },

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
    }
  }
});
