var Alexa = require("alexa-sdk");

var APP_ID = "amzn1.ask.skill.fe3b1c33-dd16-4b40-b8ff-3b98ccefc7fb";
var SKILL_NAME = "HackMerced";

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var handlers = {
  "LaunchRequest": function() {
    console.log("LaunchRequest");
    this.attributes.speechOutput = "Welcome to " + SKILL_NAME + ". You can ask a question like, ? Please tell me .";
    this.attributes.repromptSpeech = "To find , say something like: what was ?";
    this.emit(":ask", this.attributes.speechOutput, this.attributes.repromptSpeech);
  },
  "GetNumOrders": function() {
    console.log("GetNumOrders");
    this.emit(":tell", "hello");
  },
  "AMAZON.HelpIntent": function() {
    console.log("AMAZON.HelpIntent");
    var speech = "You can ask a question like, ? Please tell me .";
    this.attributes.speechOutput = speech;
    this.attributes.repromptSpeech = speech;
    this.emit(":ask", this.attributes.speechOutput, this.attributes.repromptSpeech);
  },
  "AMAZON.StopIntent": function () {
    console.log("AMAZON.StopIntent");
    this.emit("SessionEndedRequest");
  },
  "AMAZON.CancelIntent": function () {
    console.log("AMAZON.CancelIntent");
    this.emit("SessionEndedRequest");
  },
  "SessionEndedRequest":function () {
    console.log("SessionEndedRequest");
    this.emit(":tell", "Goodbye!");
  },
  "Unhandled": function() {
    console.log("Unhandled");
    this.emit(":tell", "Sorry, I was unable to understand and process your request. Please try again.");
    this.emit("SessionEndedRequest");
  }
};
