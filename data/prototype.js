var app = angular.module('prototypeApp', ['kendo.directives']);

app.controller('prototypeController', [ '$scope', function($scope) {

  var mockData = [{ 
    title: 'Test Centre Portal',
    time: '1d',
    entries: [
      {title: 'Meetings', time: '30m'},
      {title: 'Personnel Module', time: '4h'},
      {title: 'Certification SRS', time: '3h 30m'}
    ]
  },
  {
    title: 'Scrum Meetings',
    time: '2h 30m',
    entries: [
      {title: 'Monday scrum', time: '15m'},
      {title: 'Tuesday IT meeting', time: '1h 30m'},
      {title: 'Wednesday scrum', time: '15m'},
      {title: 'Thursday scrum', time: '15m'},
      {title: 'Friday scrum', time: '15m'}
    ]
  },
  { 
    title: 'SRM tasks',
    time: '2d 7h',
    entries: [
      {title: "Clarify stakeholder's requirements", time: '2h'},
      {title: 'Implement task', time: '2d 3h'},
      {title: 'Code review', time: '1h'},
      {title: 'Verify task', time: '1h'}
    ]
  }]; 

  $scope.$on('kendoRendered', function() {
    for (var i = 0; i < mockData.length; i++) {
      insertData(mockData[i]);
    }
  });

  function insertData(categoryItem) {
    var baseId = categoryItem.title.split(' ').join('');

    var categoryTemplate = kendo.template($('#category-template').html());
    var categoryTemplateData = {Category: categoryItem.title, TotalTime: categoryItem.time};
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
      var taskTemplateData = {Title: entry.title, Time: entry.time, SliderId: baseId + i};
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

}]);
