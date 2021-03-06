var app = angular.module('sunDialApp', ['kendo.directives']);

app.controller('panelController', [ '$scope', function($scope) {
  var mockData = [];
  var kendoRendered = false;
  var dataHasBeenReceived = false;

  function init() {
    setupListeners();
    setupKendo();

    $scope.displayPanel('default');

    var data = [
      {
        id: 'c0',
        title: 'Test Centre Portal',
        time: '8h',
        entries: [
          { id: 'c0t0', title: 'Meetings', time: '30m' },
          { id: 'c0t1', title: 'Personnel Module', time: '4h' },
          { id: 'c0t2', title: 'Certification SRS', time: '3h 30m' }
        ]},
      {
        id: 'c1',
        title: 'Scrum Meetings',
        time: '2h 30m',
        entries: [
          { id: 'c1t0', title: 'Monday scrum', time: '15m' },
          { id: 'c1t1', title: 'Tuesday IT meeting', time: '1h 30m' },
          { id: 'c1t2', title: 'Wednesday scrum', time: '15m' },
          { id: 'c1t3', title: 'Thursday scrum', time: '15m' },
          { id: 'c1t4', title: 'Friday scrum', time: '15m' }
        ]},
      {
        id: 'c2',
        title: 'SRM tasks',
        time: '2d 7h',
        entries: [
          { id: 'c2t0', title: "Clarify stakeholder's requirements", time: '2h' },
          { id: 'c2t1', title: 'Implement task', time: '2d 3h' },
          { id: 'c2t2', title: 'Code review', time: '1h' },
          { id: 'c2t3', title: 'Verify task', time: '1h' }
        ]}
    ];

    dataHasBeenReceived = true;
    mockData = data;
    insertDataIfAppropriate();
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

  }

  function setupKendo() {
    $scope.notificationOptions = {
      autoHideAfter: 1600,
      animation: {
        open: {
          duration: 300
        },
        close: {
          duration: 300
        }
      },
      width: 375,
      position: {
        bottom: 50,
        left: 0
      },
      templates: [{
        type: "custom-success",
        template: $("#custom-success-template").html()
      }, {
        type: "custom-error",
        template: $("#custom-error-template").html()
      }]
    };

    $scope.categoryContextMenuOptions = {
      target: '.k-panelbar',
      filter: '.k-header',
      orientation: "horizontal",
      alignToAnchor: true,
      open: function () {
        $scope.taskContextMenu.close();
      },
      select: function (e) {
        var item = e.target.parentElement;
        var title = e.target.firstElementChild.firstElementChild;
        var titleText = title.textContent;
        
        var time;
        for (var i = 0; i < mockData.length; i++) {
          if (titleText == mockData[i].title) {
            time = mockData[i].time;
          }
        }

        $scope.selectedCategory = { item: item, title: title, titleText: titleText, time: time };
        $scope.panelBar.expand($scope.selectedCategory.item);

        if (e.item.textContent == 'Add Task') {
          $scope.displayPanel('create-task');
        }
        if (e.item.textContent == 'Edit') {
          $scope.displayPanel('edit-category');
        }
        if (e.item.textContent == 'Delete') {
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
      },
      select: function (e) {
        var category = e.target.parentElement.parentElement.firstElementChild.firstElementChild.firstElementChild;
        var titleText = e.target.firstElementChild.firstElementChild.firstElementChild.textContent.substring(2);

        $scope.selectedTask = { categoryText: category.textContent, titleText: titleText };

        console.log("category", category);
        console.log("titleText", titleText);

        if (e.item.textContent == 'Edit') {
          $scope.displayPanel('edit-task');
        }
        if (e.item.textContent == 'Delete') {
          $scope.displayPanel('delete-task');
        }
        $scope.$apply();
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

  function notificationShow(message, type) {
    if ($(".k-notification").length >= 1) {
      $(".k-notification").parent().remove();
    }

    $scope.notification.show({ Message: message }, type);
  }

  function insertDataIfAppropriate() {
    if (kendoRendered && dataHasBeenReceived) {
      for (var i = 0; i < mockData.length; i++) {
        var categoryTotalTime = getTimeInMins(mockData[i].time);
        var categoryId = mockData[i].id;

        displayCategory(mockData[i].title, categoryId, mockData[i].time);
        displayTasks(mockData[i].entries, i, categoryTotalTime);
      }
    }
  }

  function taskPanelBarHelper(task, uniqueId) {
    var sliderId = "slider_" + uniqueId;

    var taskTemplate = kendo.template($("#task-template").html());
    var taskTemplateData = { TaskTitle: task.title, TaskTime: task.time, SliderId: sliderId, Id: uniqueId };
    var resultTaskHtml = taskTemplate(taskTemplateData);
      
    var resultTaskItem = { text: resultTaskHtml, encoded: false };
    return resultTaskItem;
  }

  function displayTaskSliderHelper(task, uniqueId, categoryTotalTime) {
    var sliderId = "slider_" + uniqueId;

    var taskTime = getTimeInMins(task.time);
    var taskPercentage = taskTime / categoryTotalTime * 100;       

    var taskSlider = new kendo.View(
      "slider-template",
      { model: { Value: taskPercentage }, evalTemplate: true }
    );

    taskSlider.render("#" + sliderId);
  }

  function displayTasks(tasks, categoryIndex, categoryTotalTime) {
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      var uniqueId = task.id;
      
      var resultTaskItem = taskPanelBarHelper(task, uniqueId);
      $scope.panelBar.append(resultTaskItem, $(".k-panelbar > .k-item").eq(categoryIndex));
      
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

  function getTimeInMinsInverse(timeInMins) {
    var remainingTime = timeInMins;
    var tempTime = {};

    if (remainingTime / 60 / 24 >= 1) {
      tempTime.d = Math.floor(remainingTime / 60 / 24);
      remainingTime = remainingTime % (60 * 24);
    }
    if (remainingTime / 60 >= 1) {
      tempTime.h = Math.floor(remainingTime / 60);
      remainingTime = remainingTime % 60;
    }
    if (remainingTime >= 1) {
      tempTime.m = remainingTime;
    }

    var resultTimeStr = timeObjToText(tempTime);

    return resultTimeStr;
  }

  function setStateHelper(defaultState, 
                          createCategoryState,
                          editCategoryState,
                          deleteCategoryState,
                          createTaskState,
                          editTaskState,
                          deleteTaskState) {
    $scope.defaultState = defaultState;
    $scope.createCategoryState = createCategoryState;
    $scope.editCategoryState = editCategoryState;
    $scope.deleteCategoryState = deleteCategoryState;
    $scope.createTaskState = createTaskState;
    $scope.editTaskState = editTaskState;
    $scope.deleteTaskState = deleteTaskState;
  }

  $scope.displayPanel = function (panel) {
    if (panel == 'default') {
      setStateHelper(true, false, false, false, false, false, false);
    }
    if (panel == 'create-category') {
      $scope.newCategoryTitle = "";

      setStateHelper(false, true, false, false, false, false, false);
    }
    if (panel == 'edit-category') {
      $scope.newCategoryTitle = $scope.selectedCategory.titleText;

      setStateHelper(false, false, true, false, false, false, false);
    }
    if (panel == 'delete-category') {
      setStateHelper(false, false, false, true, false, false, false);
    }
    if (panel == 'create-task') {
      $scope.displayCreateTaskTitle = true;
      $scope.displayCreateTaskTime = false;

      $scope.newTaskTitle = "";
      $scope.newTaskTime = {};

      setStateHelper(false, false, false, false, true, false, false);
    }
    if (panel == 'edit-task') {
      $scope.displayEditTaskTitle = true;

      setStateHelper(false, false, false, false, false, true, false);
    }
    if (panel == 'delete-task') {
      setStateHelper(false, false, false, false, false, false, true);
    }
  };


  function validateCategoryTitle(categoryTitle) {
    var passEmptyStrTest;
    if (categoryTitle == null && categoryTitle == "") {
      passEmptyStrTest = false;
    }
    else {
      passEmptyStrTest = true;
    }

    var passUniquenessTest = true;

    for (var i = 0; i < mockData.length; i++) {
      if (mockData[i].title == categoryTitle) {
        passUniquenessTest = false;
      }
    }

    var isValid = passEmptyStrTest && passUniquenessTest;
    return isValid;
  }

  function getNextCategoryId() {
    var highestNum = 0;
    for (var i = 0; i < mockData.length; i++) {
      var tempStr = mockData[i].id.substring(1);
      var tempNum = parseInt(tempStr);

      if (tempNum > highestNum) {
        highestNum = tempNum;
      }
    }
    
    highestNum += 1;
    var resultId = "c" + highestNum.toString();
    console.log(resultId);
    return resultId;
  }
  
  $scope.createCategory = function (newCategoryTitle) {
    if (validateCategoryTitle(newCategoryTitle)) {
      var categoryId = getNextCategoryId();

      mockData.push({ id: categoryId, title: newCategoryTitle, time: '0m', entries: [] });

      displayCategory(newCategoryTitle, categoryId, '0m');

      $scope.displayPanel('default');
      notificationShow('Successfully created category', 'custom-success');
      console.log(mockData);
    }
    else {
      notificationShow('Unsuccessfully created category', 'custom-error');
    }
  };

  $scope.updateCategory = function (newCategoryTitle) {
    if (validateCategoryTitle(newCategoryTitle)) {
      for (var i = 0; i < mockData.length; i++) {
        if (mockData[i].title == $scope.selectedCategory.titleText) {
          mockData[i].title = newCategoryTitle;
        }
      }

      $scope.selectedCategory.title.textContent = newCategoryTitle;
      $scope.displayPanel('default');
      notificationShow('Successfully edited category', 'custom-success');

      console.log(mockData);
    }
    else {
      notificationShow('Unsuccessfully edited message', 'custom-error');
    }
  }

  $scope.deleteCategory = function () {
    var deleted = false;

    var index;
    for (var i = 0; i < mockData.length; i++) {
      if (mockData[i].title == $scope.selectedCategory.titleText) {
        index = i;
      }
    }
    if (index != null) {
      mockData.splice(index, 1);
      deleted = true;
    }

    $scope.panelBar.remove($scope.selectedCategory.item);
    $scope.displayPanel('default');

    if (deleted) {
      notificationShow('Successfully deleted category', 'custom-success');
    }
    else {
      notificationShow('Unsuccessfully deleted category', 'custom-error');
    }

    console.log(mockData);
  }

  function taskTitleUniquenessHelper(taskTitle, listOfTasks) {
    var passUniquenessTest = true;
    for (var i = 0; i < listOfTasks.length; i++) {

      // console.log(listOfTasks[i].title, taskTitle);
      if (listOfTasks[i].title == taskTitle) {
        passUniquenessTest = false;
      }
    }


    // console.log(passUniquenessTest);
    return passUniquenessTest;
  }

  function taskTitleValidate(taskTitle) {
    var passEmptyStrTest;
    if (taskTitle == null || taskTitle == "") {
      passEmptyStrTest = false;
    }
    else {
      passEmptyStrTest = true;
    }

    var passUniquenessWrtCategoryTest = false;

    for (var i = 0; i < mockData.length; i++) {
      if (mockData[i].title == $scope.selectedCategory.titleText) {
        passUniquenessWrtCategoryTest = taskTitleUniquenessHelper(taskTitle, mockData[i].entries);
      }
    }

    var isValid = passEmptyStrTest && passUniquenessWrtCategoryTest;
    return isValid;
  }

  $scope.goToTaskTimeView = function (newTaskTitle) {
    if (taskTitleValidate(newTaskTitle)) {
      $scope.displayCreateTaskTitle = false; 
      $scope.displayCreateTaskTime = true;
    }
    else {
      notificationShow('Please provide a valid task title', 'custom-error');
    }

  }

  function timeObjToText(newTaskTime) {
    var taskTimeText = "";

    if (newTaskTime.d) {
      taskTimeText += newTaskTime.d + "d ";
    }
    if (newTaskTime.h) {
      taskTimeText += newTaskTime.h + "h ";
    }
    if (newTaskTime.m) {
      taskTimeText += newTaskTime.m + "m ";
    }
    taskTimeText = taskTimeText.substring(0, taskTimeText.length - 1);
    
    return taskTimeText;
  }

  function increment_last(v) {
    return v.replace(/[0-9]+(?!.*[0-9])/, parseInt(v.match(/[0-9]+(?!.*[0-9])/), 10)+1);
  }

  function getNextTaskId(categoryTitle) {
    var categoryId;
    var tasks;

    for (var i = 0; i < mockData.length; i++) {
      if (categoryTitle == mockData[i].title) {
        categoryId = mockData[i].id;
        tasks = mockData[i].entries;
      }
    }

    var highestNum = 0;
    for (var i = 0; i < tasks.length; i++) {
      var taskId = tasks[i].id;
      var tempStr = taskId.substring(taskId.indexOf("t") + 1);

      var tempNum = parseInt(tempStr);

      if (tempNum > highestNum) {
        highestNum = tempNum;
      }
    }
    
    highestNum += 1;
    var resultId = categoryId + "t" + highestNum.toString();

    return resultId;
  }

  function updateCategoryTimeHelper(categoryTimeText, timeTextToAdd) {
    var categoryTimeInMins = getTimeInMins(categoryTimeText);
    var timeTextInMins = getTimeInMins(timeTextToAdd);

    var resultCategoryTimeText = getTimeInMinsInverse(categoryTimeInMins + timeTextInMins);

    for (var i = 0; i < mockData.length; i++) {
      if (mockData[i].title == $scope.selectedCategory.titleText) {
        mockData[i].time = resultCategoryTimeText;
      }
    }

    $scope.selectedCategory.item.firstElementChild.firstElementChild.lastElementChild.textContent =
      resultCategoryTimeText;
  }

  function updateTasksSlidersHelper(newTask, uniqueId, categoryTotalTime) {
    console.log(categoryTotalTime);
    displayTaskSliderHelper(newTask, uniqueId, categoryTotalTime);
  }

  function removeSliders(categoryTitle) {
    var tasks;
    
    for (var i = 0; i < mockData.length; i++) {
      if (categoryTitle == mockData[i].title) {
        tasks = mockData[i].entries;
      }
    }

    for (var j = 0; j < tasks.length; j++) {
      var sliderId = "slider_" + tasks[j].id;

      $("#" + sliderId).children().remove();
    }
  }

  function addNewTask(newTask) {
    var resultTaskItem = taskPanelBarHelper(newTask, newTask.id);
    var lastTaskItemWrtCategory = $scope.selectedCategory.item.lastElementChild.lastElementChild;
    $scope.panelBar.insertAfter(resultTaskItem, lastTaskItemWrtCategory);

    var categoryTime = $scope.selectedCategory.time;

    updateCategoryTimeHelper(categoryTime, newTask.time);
    
    for (var i = 0; i < mockData.length; i++) {
      if ($scope.selectedCategory.titleText == mockData[i].title) {
        $scope.selectedCategory.time = mockData[i].time;
      }
    }

  }

  function addSliders() {
    var categoryTime = $scope.selectedCategory.time;
    var categoryTimeInMins = getTimeInMins(categoryTime);
    var tasks;

    for (var i = 0; i < mockData.length; i++) {
      if ($scope.selectedCategory.titleText == mockData[i].title) {
        tasks = mockData[i].entries;
      }
    }

    for (var j = 0; j < tasks.length; j++) {
      var task = tasks[j];
      updateTasksSlidersHelper(task, task.id, categoryTimeInMins);
    }

  }

  function convertTimeToLargestDenominator(timeText) {
    return getTimeInMinsInverse(getTimeInMins(timeText));
  }

  $scope.createTask = function (newTaskTitle, newTaskTime) {
    var categoryTitle = $scope.selectedCategory.titleText;
    var newTaskId = getNextTaskId(categoryTitle);
    console.log("newTaskId", newTaskId);

    var newTaskTimeText = timeObjToText(newTaskTime);
    newTaskTimeText = convertTimeToLargestDenominator(newTaskTimeText);

    var newTask = { id: newTaskId, title: newTaskTitle, time: newTaskTimeText };
    
    for (var i = 0; i < mockData.length; i++) {
      if (mockData[i].title == $scope.selectedCategory.titleText) {
        mockData[i].entries.push(newTask);
      }
    }

    removeSliders(categoryTitle);
    addNewTask(newTask);

    addSliders();

    console.log(mockData);
    // var resultTaskItem = taskPanelBarHelper(newTask, uniqueId);
    // $scope.panelBar.insertAfter(resultTaskItem, lastTaskItemWrtCategory);

    // console.log(mockData);

    // var categoryTime = $scope.selectedCategory.item.firstElementChild.firstElementChild.lastElementChild;

    // console.log($scope.selectedCategory.item.lastElementChild);

    // updateCategoryTimeHelper(categoryTime.textContent, newTask.time);
    // var categoryTimeInMins = getTimeInMins(categoryTime.textContent);
    // updateTasksSlidersHelper(newTask, uniqueId, categoryTimeInMins);

    // use data instead of jquery
    // include id in data

    // var slider = $("#slider_c0t0").data("kendoSlider");
    // slider.value(100);
  
    // var categoryTotalTime = getTimeInMins($scope.selectedCategory.item.children["category-time"].textContent);
    // var taskTime = getTimeInMins(taskTimeText);

    // var taskPercentage = taskTime / categoryTotalTime * 100;
    
    // var entrySlider = new kendo.View(
      // "slider-template",
      // { model: { Value: taskPercentage }, evalTemplate: true }
    // );

    // entrySlider.render( "#" + baseId );  

  }

    // var sliderId = "slider_" + uniqueId;

    // var taskTime = getTimeInMins(task.time);
    // var taskPercentage = taskTime / categoryTotalTime * 100;       

    // var taskSlider = new kendo.View(
      // "slider-template",
      // { model: { Value: taskPercentage }, evalTemplate: true }
    // );

    // taskSlider.render("#" + sliderId);


  $scope.openCreditPage = function () {
    self.port.emit('openCreditPage', '');
  };

  init();
}]);
