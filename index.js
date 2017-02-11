var Alexa = require("alexa-sdk");
var WooCommerceAPI = require('woocommerce-api');

var WooCommerce = new WooCommerceAPI({
  url: 'https://dhanushpatel.000webhostapp.com',
  consumerKey: 'ck_4a18255b52a2ee95a43716f0df4b3fc56de97ba1',
  consumerSecret: 'cs_78c7fc4eb8e38046f7529426190f2e0bdadbeb7e',
  wp_api: true,
  version: 'wc/v1'
});

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
  "GetCustomerOrigins": function(){
    var origins = [];
    var speech = "Your customers are from " + origins + " and so on";
    WooCommerce.get('customers', function(err, data, res) {
      res.map(function(customer) {
        origins.push(customer.billing.country);
      });
    });
  },
  "GetNumOrders": function() {
    console.log("GetNumOrders");
    this.emit(":tell", "hello");
  },
  "MostReturnedProduct": function() {
    console.log("MostReturnedProduct");
    getOrderIds().forEach(function(id) {
      WooCommerce.get('orders/' + id + '/refunds', function(err, data, res) {
        if (err) {
          console.log(err);
        }
        var product_ids = [];
        res.forEach(function(refund) {
          product_ids.push(refund.line_items.product_id);
        });
        var frequencyMap = {};
        product_ids.forEach(function(product_id) {
          if (!frequencyMap[product_id]) {
            frequencyMap[product_id] = 0;
          }
          frequencyMap[product_id]++;
        });
      });
    });
  },
  "CompleteAllOrders": function() {
    console.log("CompleteAllOrders");
    var data = {
      status: 'completed'
    };
    getOrderIds().forEach(function(id) {
      WooCommerce.post('orders/' + id, data, function(err, data, res) {
        if (err) {
          console.log(err);
        }
      });
    });
  },
  "AMAZON.HelpIntent": function() {
    console.log("AMAZON.HelpIntent");
    var speech = "You can ask a question like, ? Please tell me .";
    this.attributes.speechOutput = speech;
    this.attributes.repromptSpeech = speech;
    this.emit(":ask", this.attributes.speechOutput, this.attributes.repromptSpeech);
  },
  "AMAZON.StopIntent": function() {
    console.log("AMAZON.StopIntent");
    this.emit("SessionEndedRequest");
  },
  "AMAZON.CancelIntent": function() {
    console.log("AMAZON.CancelIntent");
    this.emit("SessionEndedRequest");
  },
  "SessionEndedRequest":function() {
    console.log("SessionEndedRequest");
    this.emit(":tell", "Goodbye!");
  },
  "Unhandled": function() {
    console.log("Unhandled");
    this.emit(":tell", "Sorry, I was unable to understand and process your request. Please try again.");
    this.emit("SessionEndedRequest");
  }
};

function getOrderIds() {
  WooCommerce.get('orders', function(err, data, res) {
    if (err) {
      console.log(err);
    }
    var ids = [];
    res.forEach(function(order) {
      ids.push(order.id);
    });
  });
  return ids;
}
