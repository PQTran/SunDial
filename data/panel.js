var app = angular.module('prototypeApp', ['kendo.directives']);

app.controller('prototypeController', [ '$scope', function($scope) {

  var mockData = [];
  var kendoRendered = false;
  var dataHasBeenReceived = false;
  
  self.port.emit('sendData');

  self.port.on('data', function (data) {
    dataHasBeenReceived = true;
    mockData = data;
    if (kendoRendered && dataHasBeenReceived) {
      for (var i = 0; i < mockData.length; i++) {
        insertData(mockData[i]);
      }
    }
  });

  

  $scope.contextMenuOptions = {
    target: '.k-item',
    alignToAnchor: true
  };

  $scope.$on('kendoRendered', function() {
    kendoRendered = true;
    
    if (kendoRendered && dataHasBeenReceived) {
      for (var i = 0; i < mockData.length; i++) {
        insertData(mockData[i]);
      }
    }
  });

  $('#panel').scroll(function () {
    $scope.categoryContextMenu.close();
    $scope.taskContextMenu.close();
  });

  self.port.on('resetApp', function () {
    $scope.categoryContextMenu.close();
    $scope.taskContextMenu.close();
    $scope.panelBar.collapse($('.k-header > .k-item'));
    $scope.panelBar.clearSelection();
    $scope.displayPanel('default');
  });

  $scope.categoryContextMenuOptions = {
    target: '.k-panelbar',
    filter: '.k-header',
    orientation: "horizontal",
    alignToAnchor: true,
    open: function () {
      $scope.taskContextMenu.close();
    }
  };

  $scope.taskContextMenuOptions = {
    target: '.k-panelbar',
    filter: '.k-group .k-item',
    orientation: "horizontal",
    alignToAnchor: true,
    open: function () {
      $scope.categoryContextMenu.close();
    }
  };

  $('#panel').kendoTooltip({
    position: 'top',
    width: 180,
    filter: '#task-title, #category-title',
    show: function (e) {
      if (this.content.text() != '') {
        this.popup.wrapper.width('auto');
        $('[role="tooltip"]').css('visibility', 'visible');
      }
    },
    hide: function () {
      $('[role="tooltip"]').css('visibility', 'hidden'); 
    },
    content: function (e) {
      var element = e.target[0];

      if (element.offsetWidth < element.scrollWidth && element.id == 'category-title') {
        return e.target.text();
      }
      if (element.offsetWidth < element.scrollWidth && element.id == 'task-title') {
        return e.target.text().substring(2);
      }
      else {
        return '';
      }
    }
  });


  function insertData(categoryItem) {
    var baseId = categoryItem.title.split(' ').join('');

    var categoryTemplate = kendo.template($('#category-template').html());
    var categoryTemplateData = {CategoryTitle: categoryItem.title, CategoryTime: categoryItem.time};
    var resultCategoryHtml = categoryTemplate(categoryTemplateData);

    var taskItems = generateTaskItems(baseId, categoryItem);

    $scope.panelBar.append({text: resultCategoryHtml, encoded: false, items: taskItems});

    generateTaskItemSliders(baseId, categoryItem);
  }

  function generateTaskItems(baseId, categoryItem) {
    var entries = categoryItem.entries;

    var resultTaskItems = [];
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      
      var taskTemplate = kendo.template($("#task-template").html());
      var taskTemplateData = {TaskTitle: entry.title, TaskTime: entry.time, SliderId: baseId + i};
      var resultTaskHtml = taskTemplate(taskTemplateData);

      var resultTaskItem = {text: resultTaskHtml, encoded: false};
      resultTaskItems.push(resultTaskItem);
    }

    return resultTaskItems;
  }

  function generateTaskItemSliders(baseId, categoryItem) {
    var entries = categoryItem.entries;
    var categoryTotalTime = getTimeInMins(categoryItem.time);
    
    for (var i = 0; i < entries.length; i++) {
       var entry = entries[i];
       var entryTime = getTimeInMins(entry.time);
       var entryPercentage = entryTime / categoryTotalTime * 100;       

       var entrySlider = new kendo.View(
         "slider-template",
         {model: {Value: entryPercentage}, evalTemplate: true}
       );

       entrySlider.render("#" + baseId + i);  
    }
  }

  function getTimeInMins(timeStr) {
    var timeArr = timeStr.split(' ');
    var result = 0;    

    for (var i = 0; i < timeArr.length; i++) {
       if (timeArr[i].slice(-1) == "d")
         result += parseInt(timeArr[i].replace(/\D+$/g, "")) * 8 * 60;

       if (timeArr[i].slice(-1) == "h")
         result += parseInt(timeArr[i].replace(/\D+$/g, "")) * 60;

       if (timeArr[i].slice(-1) == "m")
         result +=  parseInt(timeArr[i].replace(/\D+$/g, ""));
    }

    return result;
  }

  $scope.displayPanel = function (panel) {
    if (panel == 'default') {
      $scope.defaultState = true;
      $scope.createCategoryState = false;
    }
    if (panel == 'create-category') {
      $scope.defaultState = false;
      $scope.createCategoryState = true;
    }
  };


  $scope.createCategory = function (newCategoryTitle) {
    var categoryTemplate = kendo.template($('#category-template').html());
    var categoryTemplateData = {CategoryTitle: newCategoryTitle, CategoryTime: "0m"};
    var resultCategoryHtml = categoryTemplate(categoryTemplateData);

    $scope.panelBar.append({text: resultCategoryHtml, encoded: false});

    $scope.displayPanel('default');
  };

  $scope.displayPanel('default');
  
  $scope.openCreditPage = function () {
    self.port.emit('openCreditPage', '');
  };

}]);
