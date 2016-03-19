var self = require("sdk/self");

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
// function dummy(text, callback) {
  // callback(text);
// }

// exports.dummy = dummy;

var { ToggleButton } = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var tabs = require("sdk/tabs");

var simpleStorage = require("sdk/simple-storage");
simpleStorage.storage.data = [
  { Category1: [{ title: "Title1", time: "30m" }, { title: "Title2", time: "2h" }] },
  { Category2: [] },
  { Category3: [{ title: "Title3", time: "3h 30m"}] }
];

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
   width: 350,
   height: 250,
   contentURL: "./panel.html",
   contentScriptFile: [ "./jquery.min.js", "./angular.min.js", "./kendo.all.min.js", "./panel.js"],
   contentScriptWhen: "start",
   onHide: handleHide
});

function handleHide() {
   button.state('window', { checked: false });
}

panel.port.emit("testResponse", simpleStorage.storage.data);
