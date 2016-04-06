var app = angular.module('sunDialApp', ['kendo.directives']);

app.controller('panelController', [ '$scope', function($scope) {

  var mockData = [];
  var kendoRendered = false;
  var dataHasBeenReceived = false;

  function init() {
    setupListeners();
    setupKendo();

    $scope.displayPanel('default');
    self.port.emit('sendData');
  }

  function setupListeners() {
    $('#panel').scroll(function () {
      $scope.categoryContextMenu.close();
      $scope.taskContextMenu.close();
    });

    $scope.$on('kendoRendered', function() {
      kendoRendered = true;
      insertDataIfAppropriate();
    });

    self.port.on('data', function (data) {
      dataHasBeenReceived = true;
      mockData = data;
      insertDataIfAppropriate();
    });

    self.port.on('resetApp', function () {
      $scope.categoryContextMenu.close();
      $scope.taskContextMenu.close();
      $scope.panelBar.collapse($('.k-header > .k-item'));
      $scope.panelBar.clearSelection();

      $scope.displayPanel('default');
      $scope.$apply();
    });
  }

  function setupKendo() {
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
  }

  function insertDataIfAppropriate() {
    if (kendoRendered && dataHasBeenReceived) {
      for (var i = 0; i < mockData.length; i++) {
        var categoryTotalTime = getTimeInMins(mockData[i].time);
        var categoryId = "c" + i.toString();

        displayCategory(mockData[i].title, categoryId, mockData[i].time);
        displayTasks(mockData[i].entries, i, categoryTotalTime);
      }
    }
  }

  function createUniqueId(categoryIndex, taskIndex) {
    return "c" + categoryIndex.toString() + "t" + taskIndex.toString();
  }

  function displayTaskPanelBarHelper(task, uniqueId, categoryIndex) {
      var taskTemplate = kendo.template($("#task-template").html());
      var taskTemplateData = { TaskTitle: task.title, TaskTime: task.time, SliderId: "slider_" + uniqueId, Id: uniqueId };
      var resultTaskHtml = taskTemplate(taskTemplateData);
      
      var resultTaskItem = { text: resultTaskHtml, encoded: false };
      
      $scope.panelBar.append(resultTaskItem, $(".k-panelbar > .k-item").eq(categoryIndex));
  }

  function displayTaskSliderHelper(task, uniqueId, categoryTotalTime) {
    var taskTime = getTimeInMins(task.time);
    var taskPercentage = taskTime / categoryTotalTime * 100;       

    var taskSlider = new kendo.View(
      "slider-template",
      { model: { Value: taskPercentage }, evalTemplate: true }
    );

    taskSlider.render("#" + "slider_" + uniqueId);
  }

  function displayTasks(tasks, categoryIndex, categoryTotalTime) {
    for (var i = 0; i < tasks.length; i++) {
      var uniqueId = createUniqueId(categoryIndex, i);
      var task = tasks[i];

      displayTaskPanelBarHelper(task, uniqueId, categoryIndex);
      displayTaskSliderHelper(task, uniqueId, categoryTotalTime);
    }
  }

  function displayCategory(categoryTitle, categoryId, categoryTime) {
    var categoryTemplate = kendo.template($('#category-template').html());
    var categoryTemplateData = { CategoryTitle: categoryTitle, CategoryTime: categoryTime, Id: categoryId };
    var resultCategoryHtml = categoryTemplate(categoryTemplateData);

    $scope.panelBar.append({ text: resultCategoryHtml, encoded: false });
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

  function setStateHelper(defaultState, 
                          createCategoryState,
                          deleteCategoryState,
                          createTaskState) {
    $scope.defaultState = defaultState;
    $scope.createCategoryState = createCategoryState;
    $scope.deleteCategoryState = deleteCategoryState;
    $scope.createTaskState = createTaskState;
  }

  $scope.displayPanel = function (panel) {
    if (panel == 'default') {
      setStateHelper(true, false, false, false);
    }
    if (panel == 'create-category') {
      $scope.newCategoryTitle = "";

      setStateHelper(false, true, false, false);
    }
    if (panel == 'delete-category') {
      setStateHelper(false, false, true, false);
    }
    if (panel == 'create-task') {
      $scope.displayCreateTaskTitle = true;

      setStateHelper(false, false, false, true);
    }
  };


  function validateCategoryTitle() {
    var isValid = true;
    isValid = isValid && $scope.newCategoryTitle != "";
    return isValid;
  }

  $scope.createCategory = function (newCategoryTitle) {
    if (validateCategoryTitle()) {
      var categoryId = "c" + $(".k-panelbar > .k-item").length.toString();

      mockData.push({ title: newCategoryTitle, time: '0m', entries: [] });

      displayCategory(newCategoryTitle, categoryId , '0m');

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

  $scope.openCreditPage = function () {
    self.port.emit('openCreditPage', '');
  };

  init();
}]);
