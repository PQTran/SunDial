var self = require("sdk/self");

var { ToggleButton } = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var tabs = require("sdk/tabs");

var simpleStorage = require("sdk/simple-storage");

if (simpleStorage.storage.data == null) {

  simpleStorage.storage.data = [
    {
      title: 'Test Centre Portal',
      time: '8h',
      entries: [
        { title: 'Meetings', time: '30m' },
        { title: 'Personnel Module', time: '4h' },
        { title: 'Certification SRS', time: '3h 30m' }
      ]},
    {
      title: 'Scrum Meetings',
      time: '2h 30m',
      entries: [
        { title: 'Monday scrum', time: '15m' },
        { title: 'Tuesday IT meeting', time: '1h 30m' },
        { title: 'Wednesday scrum', time: '15m' },
        { title: 'Thursday scrum', time: '15m' },
        { title: 'Friday scrum', time: '15m' }
      ]},
    { 
      title: 'SRM tasks',
      time: '2d 7h',
      entries: [
        { title: "Clarify stakeholder's requirements", time: '2h' },
        { title: 'Implement task', time: '2d 3h' },
        { title: 'Code review', time: '1h' },
        { title: 'Verify task', time: '1h' }
      ]}
  ];

}


var button = ToggleButton({
   id: "sundial-button",
   label: "SunDial",
   icon: {
      "16": "./icon-16.png",
      "32": "./icon-32.png",
      "64": "./icon-64.png"
   },
   onChange: handleChange
});

function handleChange(state) {
   if (state.checked) {
     panel.show({
       position: button
     });
   }
}

var panel = panels.Panel({
   width: 375,
   height: 300,
   contentURL: "./panel.html",
   contentScriptFile: ["./jquery.min.js", "./angular.min.js", "./kendo.all.min.js", "./panel.js"],
   contentScriptWhen: "start",
   onHide: handleHide
});

function handleHide() {
  panel.port.emit('resetApp');
  panel.port.emit('getData');
  button.state('window', { checked: false });
}

panel.port.on('openCreditPage', function () {
  tabs.open('https://github.com/PQTran');
  panel.hide();
});

panel.port.on('sendData', function () {
  panel.port.emit('data', simpleStorage.storage.data);
});

panel.port.on('saveData', function (data) {
  simpleStorage.storage.data = data;
});
