var app = angular.module('sunDialApp', ['kendo.directives']);

app.controller('panelController', [ '$scope', function($scope) {

  var mockData = [];
  var kendoRendered = false;
  var dataHasBeenReceived = false;
  
  self.port.emit('sendData');

  function insertDataIfAppropriate() {
    if (kendoRendered && dataHasBeenReceived) {
      for (var i = 0; i < mockData.length; i++) {
        insertData(mockData[i]);
      }
    }
  }

  self.port.on('data', function (data) {
    dataHasBeenReceived = true;
    mockData = data;
    insertDataIfAppropriate();
  });

  $scope.$on('kendoRendered', function() {
    kendoRendered = true;
    insertDataIfAppropriate();
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
    $scope.$apply();
  });

  $scope.categoryContextMenuOptions = {
    target: '.k-panelbar',
    filter: '.k-header',
    orientation: "horizontal",
    alignToAnchor: true,
    open: function () {
      $scope.taskContextMenu.close();
    },
    select: function (e) {
      $scope.selectedCategory = { item: e.target, title: e.target.firstElementChild.innerText };
      $scope.panelBar.expand($scope.selectedCategory.item.parentElement);
      if (e.item.innerText == 'Add Task') {
        $scope.displayPanel('create-task');
      }
      if (e.item.innerText == 'Edit') {
      }
      if (e.item.innerText == 'Delete') {
        $scope.displayPanel('delete-category');
      }
      $scope.$apply();
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
    var categoryTemplateData = { CategoryTitle: categoryItem.title, CategoryTime: categoryItem.time };
    var resultCategoryHtml = categoryTemplate(categoryTemplateData);

    var taskItems = generateTaskItems(baseId, categoryItem);

    $scope.panelBar.append({ text: resultCategoryHtml, encoded: false, items: taskItems });

    generateTaskItemSliders(baseId, categoryItem);
  }

  function generateTaskItems(baseId, categoryItem) {
    var entries = categoryItem.entries;

    var resultTaskItems = [];
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      
      var taskTemplate = kendo.template($("#task-template").html());
      var taskTemplateData = { TaskTitle: entry.title, TaskTime: entry.time, SliderId: baseId + i };
      var resultTaskHtml = taskTemplate(taskTemplateData);
      
      var resultTaskItem = { text: resultTaskHtml, encoded: false };
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
         { model: { Value: entryPercentage }, evalTemplate: true }
       );

       entrySlider.render("#" + baseId + i);  
    }
  }

  function getTimeInMins(timeStr) {
    var timeArr = timeStr.split(' ');
    var result = 0;    

    for (var i = 0; i < timeArr.length; i++) {
       if (timeArr[i].slice(-1) == "d")
         result += parseInt(timeArr[i].replace(/\D+$/g, "")) * 24 * 60;
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
      $scope.deleteCategoryState = false;
      $scope.createTaskState = false;
    }
    if (panel == 'create-category') {
      $scope.newCategoryTitle = "";

      $scope.defaultState = false;
      $scope.createCategoryState = true;
      $scope.deleteCategoryState = false;
      $scope.createTaskState = false;
    }
    if (panel == 'delete-category') {
      $scope.defaultState = false;
      $scope.createCategoryState = false;
      $scope.deleteCategoryState = true;
      $scope.createTaskState = false;
    }
    if (panel == 'create-task') {
      $scope.displayCreateTaskTitle = true;

      $scope.defaultState = false;
      $scope.createCategoryState = false;
      $scope.deleteCategoryState = false;
      $scope.createTaskState = true;
    }
  };

  function validateCategoryTitle() {
    var isValid = true;
    isValid = isValid && $scope.newCategoryTitle != "";
    return isValid;
  }

  $scope.createCategory = function (newCategoryTitle) {
    if (validateCategoryTitle()) {
      mockData.push({ title: newCategoryTitle, time: '0m', entries: [] });

      var categoryTemplate = kendo.template($('#category-template').html());
      var categoryTemplateData = { CategoryTitle: newCategoryTitle, CategoryTime: '0m' };
      var resultCategoryHtml = categoryTemplate(categoryTemplateData);

      $scope.panelBar.append({ text: resultCategoryHtml, encoded: false });

      $scope.displayPanel('default');
    }
    else {
      // display notification
    }
  };

  $scope.deleteCategory = function () {
    var index;
    for (var i = 0; i < mockData.length; i++) {
      if (mockData[i].title == $scope.selectedCategory.title) {
        index = i;
      }
    }
    if (index) {
      mockData.splice(index, 1);
    }

    $scope.panelBar.remove($scope.selectedCategory.item.parentElement);
    $scope.displayPanel('default');
  }

  function increment_last(v) {
    return v.replace(/[0-9]+(?!.*[0-9])/, parseInt(v.match(/[0-9]+(?!.*[0-9])/), 10)+1);
  }

  $scope.createTask = function () {
    var taskTimeText = "";
    if ($scope.newTaskTimeD) {
      taskTimeText += $scope.newTaskTimeD + "d ";
    }
    if ($scope.newTaskTimeH) {
      taskTimeText += $scope.newTaskTimeH + "h ";
    }
    if ($scope.newTaskTimeM) {
      taskTimeText += $scope.newTaskTimeM + "m ";
    }
    taskTimeText = taskTimeText.substring(0, taskTimeText.length - 1);

    var tempBaseStr = $($scope.selectedCategory.item.nextElementSibling.lastElementChild).find('.task-time-slider')[0].id;
   
    var baseId = increment_last(tempBaseStr);
      
    console.log(baseId);

    var taskTemplate = kendo.template($("#task-template").html());
    var taskTemplateData = { TaskTitle: $scope.newTaskTitle, TaskTime: taskTimeText, SliderId: baseId };
    var resultTaskHtml = taskTemplate(taskTemplateData);
    var resultTaskItem = [{ text: resultTaskHtml, encoded: false }];
    
    

    $scope.panelBar.insertAfter(resultTaskItem, $scope.selectedCategory.item.nextElementSibling.lastElementChild);

    
    var categoryTotalTime = getTimeInMins($scope.selectedCategory.item.children["category-time"].innerText);
    var taskTime = getTimeInMins(taskTimeText);

    var taskPercentage = taskTime / categoryTotalTime * 100;
    
    var entrySlider = new kendo.View(
      "slider-template",
      { model: { Value: taskPercentage }, evalTemplate: true }
    );

    entrySlider.render( "#" + baseId );  

  }

  $scope.displayPanel('default');
  
  $scope.openCreditPage = function () {
    self.port.emit('openCreditPage', '');
  };

}]);
