var app = angular.module("prototypeApp", ["kendo.directives"]);

app.controller("prototypeController", [ "$scope", function($scope) {
   $scope.sliderOptions = {
      max: 100,
      tickPlacement: "none",
      showButtons: false,
      tooltip: {
        enabled: false
      },
      value: 55
   };

//  var data = { title: "Test Centre Portal", time: "1d", entries: [{ title: "Meetings", time: "30m" }, { title: "Personnel Module", time: "4h" }, { title: "Certification SRS", time: "3h 30m" }] };

  $scope.$on("kendoRendered", function(e) {
    for (var i = 0; i < 10; i++) {
      insertData(i);
    }
  });

  var insertData = function (i) {
    var template = kendo.template($("#categoryPanelTemplate").html());
    var templateData = { Category: "Certification SRS", Time: "2d 3h 15m" };
    var content = template(templateData);

    var childTemplate = kendo.template($("#categoryChildPanelTemplate").html());
    var childTemplateData = { Title: "Meeting on requirements", Time: "2h", Id: "Test"+i };
    var childContent = childTemplate(childTemplateData);

    $scope.panelBar.append([{ text: content, encoded: false, items: [{ text: childContent, encoded: false }]}]);

    renderSlider(i);
  }

  var renderSlider = function (Id) {
    var randomValue = Math.floor(Math.random() * 101);
    var index = new kendo.View("sliderTemplate", { model: { Value: randomValue }, evalTemplate: true });
    console.log(randomValue);
    index.render("#Test" + Id);
  }
 
   $scope.panelBarOptions = {
      dataSource: [
//        {
//          text: "<p>embed html</p>",
//          encoded: false,
//          content: "test_Content"
//        },
//        {
//          text: "<p>embed html in title and content</p>",
//          encoded: false,
//          content: "<p>html content</p>"
//        },
//        {
//          text: "multiple content",
//          encoded: false,
//          items: [{ text: "nested item #1" }, { text: "nested item #2" }]
//        },
//        {
//          text: '<div kendo-slider k-options="sliderOptions" disabled></div>',
//          encoded: false,
//          content: "test_Content"
//        },
//        {
//          text: '<div kendo-slider k-options="sliderOptions" disabled></div>',
//          encoded: false,
//          content: "test_Content"
//        },
//        {
//          text: '<div kendo-slider k-options="sliderOptions" disabled></div>',
//          encoded: false,
//          content: "test_Content"
//        },
      ]
   };

}]);
