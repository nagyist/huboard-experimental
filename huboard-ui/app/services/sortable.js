import Ember from "ember";

var SortableService = Ember.Service.extend({
  board: Ember.inject.service(),
  columns: [],

  append: function(column){
    var self = this;
    column.$(".cards").sortable({
      helper: "clone",
      items: "li.card",
      placeholder: "ui-sortable-placeholder",
      connectWith: "ul.cards",
      start: function(ev, ui){
        self.set("originIndex", ui.item.index());

        var column = self.findColumn(ui);
        self.set("originColumn", column);

        var card = self.findIssue(ui);
        self.set("cardInFlight", card);
      },
      update: function(ev, ui){
        if (this !== ui.item.parent()[0]){return ;}

        var index = ui.item.index();
        var column = self.findColumn(ui);
        var issues = column.get("issues").sort(column.sortStrategy);
        //issues.forEach(function(i){console.log(i.title)});

        var issue = self.get("cardInFlight.issue");
        var mod = self.indexModifier(index, self.columnChanged(column));
        var issue_above = self.issueAbove(index, issues, mod);
        var issue_below = self.issueBelow(index, issues, mod);

        if(!issue_above && !issue_below){return ;}
        if(!issue_above){ return self.moveToTop(issue, issue_below); }
        console.log(`Above: ${issue_above.title}`);
        if(!issue_below){ return self.moveToBottom(issue, issue_above); }
        console.log(`Below: ${issue_below.title}`);
        self.move(issue, issue_above, issue_below);
      },
      stop: function(ev, ui){
        var column = self.findColumn(ui);
        var issue = self.get("cardInFlight.issue");
        if(self.columnChanged(column)){
          issue.set("column", column.get("column"))
        }
      },
    });
  },
  move: function(issue, issue_above, issue_below){
    var above_order = issue_above._data.order;
    var below_order = issue_below._data.order;
    var order = (above_order + below_order) / 2;
    issue.set("_data.order", order);
  },
  moveToTop: function(issue, issue_below){
    var order = (issue_below._data.order) / 2;
    issue.set("_data.order", order);
  },
  moveToBottom: function(issue, issue_above){
    var order = issue_above._data.order + 1;
    issue.set("_data.order", order);
  },
  findColumn: function(element){
    return this.get("columns").find(function(column){
      var column_element = Ember.$(element.item).closest(".column");
      return column.$().is(column_element);
    });
  },
  findIssue: function(element){
    return this.get("cards").find(function(card){
      return card.$().is(element.item);
    });
  },
  issueAbove: function(index, issues, mod){
    if(index + mod && issues.length){
      return issues.objectAt((index + mod) - 1);
    }
    return null;
  },
  issueBelow: function(index, issues, mod){
    if(!(index + mod) && issues.length){
      return issues.objectAt(0);
    } else if((index + mod) !== (issues.length - 1)){
      return issues.objectAt(index + mod);
    } else if(index !== (issues.length - 1) && mod){
      return issues.objectAt(index + mod);
    } else if((index + mod) === issues.length - 1){
      return issues.get("lastObject");
    }
    return null;
  },
  columnChanged: function(column){
    return !this.get("originColumn").$().is(column.$());
  },
  indexModifier: function(index, column_changed){
    //Adjust based on issue dragging up or down
    if(column_changed){ return 0; }
    return index >= this.get("originIndex") ? 1 : 0;
  },

  cards: [],
  addCard: function(issue){
    this.get("cards").addObject(issue);
  },
  removeCard: function(issue){
    this.get("cards").removeObject(issue);
  }
});

export default SortableService;