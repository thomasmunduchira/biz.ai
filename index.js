var Alexa = require('alexa-sdk');
var WooCommerceAPI = require('woocommerce-api');
var sentiment = require('sentiment');

var WooCommerce = new WooCommerceAPI({
  url: 'http://dhanushpatel.x10host.com/',
  consumerKey: 'ck_365a06a1c7fb871432485d71d8a5c3aa063fa958',
  consumerSecret: 'cs_53601b80bf1829af2bfcaa1d90e44642d13b9249',
  wpAPI: true,
  version: 'wc/v1'
});

var APP_ID = "amzn1.ask.skill.fe3b1c33-dd16-4b40-b8ff-3b98ccefc7fb";
var SKILL_NAME = "HackMerced";

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers, sellingHandlers);
  alexa.execute();
};

var handlers = {
  "LaunchRequest": function() {
    console.log("LaunchRequest");
    this.attributes.speechOutput = "Welcome to " + SKILL_NAME + ". You can ask a question like, ? Please tell me .";
    this.attributes.repromptSpeech = "To find , say something like: what was ?";
    this.emit(":ask", this.attributes.speechOutput, this.attributes.repromptSpeech);
  },
  "SellItem": function() {
    console.log("SellItem");
    var data = {
      name: 'Premium Quality',
      type: 'simple',
      regular_price: '21.99',
      description: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.',
      short_description: 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    };
    WooCommerce.post('products', data, function(err, data, res) {
      var speech = "Product " + data.name + " has been created and is now selling at " + data.regular_price;
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "GetCustomerOrigins": function() {
    console.log("GetCustomerOrigins");
    _this = this;
    WooCommerce.get('orders', function(err, data, res) {
      if (err) {
        return console.log(err);
      }
      var origins = [];
      var customers = JSON.parse(res);
      customers.map(function(customer) {
        origins.push(customer.billing.city);
      });
      var speech = "Your customers are from " + origins.join() + " and so on";
      _this.emit(":tell", speech);
    });
  },
  "GetNumOrders": function() {
    console.log("GetNumOrders");
    _this = this;
    getOrderIds(function(ids) {
      numOrders = ids.length;
      var speech = "You currently have " + numOrders + " orders";
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "MostReturnedProduct": function() {
    console.log("MostReturnedProduct");
    _this = this;
    getOrderIds(function(ids) {
      var order_ids = [];
      ids.forEach(function(id) {
        WooCommerce.get('orders/' + id + '/refunds', function(err, data, res) {
          if (err) {
            return console.log(err);
          }
          var resJSON = JSON.parse(res);
          resJSON.forEach(function(refund) {
            console.log(refund.line_items.product_id);
            order_ids.push(refund.line_items.product_id);
          });
        });
      });
      var frequencyMap = {};
      product_ids.forEach(function(product_id) {
        if (!frequencyMap[product_id]) {
          frequencyMap[product_id] = 0;
        }
        frequencyMap[product_id]++;
      });
      var max_product_id;
      var max_frequency;
      for (var key in frequencyMap) {
        if (validation_messages.hasOwnProperty(key)) {
          var frequency = frequencyMap[key];
          if (frequency >= max_frequency) {
            max_product_id = key;
            max_frequency = frequency;
          }
        }
      }
      WooCommerce.get('products/' + max_product_id, function(err, data, res) {
        if (err) {
          return console.log(err);
        }
        var resJSON = JSON.parse(res);
        var product_name = resJSON.name;
        var speech = "Your most returned product is " + product_name + ", with " + max_frequency + " returns";
        console.log(speech);
        _this.emit(":tell", speech);
      });
    });
  },
  "MostPopularProduct": function() {
    console.log("MostPopularProduct");
    _this = this;
    WooCommerce.get('products', function(err, data, res) {
      if (err) {
        return console.log(err);
      }
      var max_product_name;
      var max_product_sales = 0;
      var resJSON = JSON.parse(res);
      resJSON.forEach(function(product) {
        if (product.total_sales >= max_product_sales) {
          max_product_name = product.name;
          max_product_sales = product.total_sales;
        }
      });
      var speech = "Your most popular product is " + max_product_name + " with " + max_product_sales + " sales";
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "CompleteOrder": function() {
    console.log("CompleteOrder");
    var order_id = 73;
    _this = this;
    completeOrder(order_id, function() {
      var speech = "Your order has been marked complete";
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "CompleteAllOrders": function() {
    console.log("CompleteAllOrders");
    _this = this;
    getOrderIds(function(ids) {
      console.log(ids);
      ids.forEach(function(id) {
        console.log(id);
        completeOrder(id, function() {});
      });
      var speech = "Your orders have been marked complete";
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "NetProfit": function() {
    console.log("NetProfit");
    _this = this;
    WooCommerce.get('reports/sales', function(err, data, res) {
      if (err) {
        return console.log(err);
      }
      var resJSON = JSON.parse(res);
      var net_sales = resJSON[0].net_sales;
      var speech = "Your net profit is " + net_sales + " dollars";
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "CouponNeeded": function() {
    console.log("CouponNeeded");
    var product_id = this.event.request.intent.slots.productId.value;
    _this = this;
    getProductReviewSentimentScore(product_id, function(score) {
      var speech = "Product " + product_id;
      if (score < 0) {
        speech += "does need a coupon due to lower than usual sales";
      } else {
        speech += "does not need a coupon due to strong sales";
      }
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "CreateCoupons": function() {
    console.log("CreateCoupons");
    _this = this;
    var data = {
      code: '10off' + Date(),
      discount_type: 'percent',
      amount: '10',
      individual_use: true,
      exclude_sale_items: true,
    };
    WooCommerce.post('coupons', data, function(err, data, res) {
      if (err) {
        return console.log(err);
      }
      var speech = "Your ten percent off coupon has been released";
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "ProductReviewRating": function() {
    console.log("ProductReviewRating");
    var product_id = 32;
    _this = this;
    var ratingList = ['highly negative', 'negative', 'mixed', 'positive', 'highly favorable'];
    getProductReviewSentimentScore(product_id, function(score) {
      var ratingIndex;
      if (score <= -1.75) {
        ratingIndex = 0;
      } else if (score <= -0.5) {
        ratingIndex = 1;
      } else if (score >= 1.75) {
        ratingIndex = 4;
      } else if (score >= 0.5) {
        ratingIndex = 3;
      } else {
        ratingIndex = 2;
      }
      var rating = ratingList[ratingIndex];
      var speech = "Customers have a " + rating + " opinion of product " + product_id;
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "SalesForecast": function() {
    console.log("SalesForecast");
    var product_id = 32;
    _this = this;
    WooCommerce.get('products/' + product_id, function(err, data, res) {
      if (err) {
        return console.log(err);
      }
      var resJSON = JSON.parse(res);
      var product_price = parseFloat(resJSON.price);
      getProductReviewSentimentScore(product_id, function(score) {
        var new_product_price = score + product_price;
        var percentage = (new_product_price / product_price - 1) * 100;
        var speech = "In the next quarter, the price of product " + product_id + " will " + (score > 0 ? "increase" : "decrease") +" by " + Math.round(percentage * 100) / 100 + "% from " + product_price + " dollars to " + Math.round(new_product_price * 100) / 100 + " dollars";
        console.log(speech);
        _this.emit(":tell", speech);
      });
    });
  },
  "DailyBusinessReport": function() {
    console.log("DailyBusinessReport");
    var today = new Date();
    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var day = ("0" + (today.getDate() - 1)).slice(-2);
    _this = this;
    WooCommerce.get('reports/sales?date_min=' + year + '-' + month + '-' + day, function(err, data, res) {
      if (err) {
        return console.log(err);
      }
      var resJSON = JSON.parse(res);
      var total_orders = resJSON[0].total_orders;
      var total_sales = resJSON[0].total_sales;
      var speech = "Yesterday, " + total_orders + " orders were placed and " + total_sales + " dollars were earned in profit";
      console.log(speech);
      _this.emit(":tell", speech);
    });
  },
  "BestProductCategory": function() {
    console.log("BestProductCategory");
    var tags = {};
    WooCommerce.get('products', function(err, data, res) {
      if (err) {
        return console.log(err);
      }
      var resJSON = JSON.parse(res);
      resJSON.forEach(function(product) {
        var product_tags = product.tags;
        product_tags.forEach(function(tag) {
          if (!tags[tag.name]) {
            tags[tag.name] = [];
          }
          tags[tag.name].push(product.id);
        });
      });
      var best_selling_category_name;
      var best_selling_category_average_sales = 0;
      console.log(tags);
      for (var tag in tags) {
        if (tags.hasOwnProperty(tag)) {
          console.log(tags[tag]);
          var number_of_products = 0;
          var total_sales = 0;
          tags[tag].forEach(function(product_id) {
            var first = true;
            WooCommerce.get('products/' + product_id, function(err, data, res) {
              if (err) {
                return console.log(err);
              }
              var resJSON = JSON.parse(res);
              var number_of_products = resJSON.length;
              var product_sales = parseFloat(resJSON.total_sales);
              total_sales += product_sales;
            });
          });
          console.log(total_sales);
          console.log(number_of_products);
          var average_sales = total_sales / number_of_products;
          if (average_sales >= best_selling_category_average_sales) {
            best_selling_category_name = tag;
            best_selling_category_average_sales = average_sales;
          }
        }
      }
      var speech = "Your best selling product category is " + best_selling_category_name + ", with average sales per product of " + best_selling_category_average_sales + " dollars";
      console.log(speech);
      _this.emit(":tell", speech);
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

var data = {
  vname: "",
  regular_price: "",    
};

var sellingHandlers = {
  'SellingStuff': function() {
    console.log(this.event.request.intent.slots.productName);
    console.log(this.event.request.intent.slots.productPrice);
    data.name = this.event.request.intent.slots.productName.value;
    data.regular_price = this.event.request.intent.slots.productPrice.value;
    this.emit(':ask', 'Alright! Would you like to provied any description for ' + this.event.request.intent.slots.productName.value + ' ?');
  },
  'AMAZON.YesIntent': function() {
    this.emit(':ask', "and your description is?");
  },
  'AMAZON.NoIntent': function() {
    this.emit(':tell', 'Ok, Your item is in the store.');
    WooCommerce.post('products', data, function(err, data, res) {
      console.log(res);
    });
  },
  "MakeDescription": function() {
    data.description = this.event.request.intent.slots.description.value;
    WooCommerce.post('products', data, function(err, data, res) {
      console.log(res);
    });
    this.emit(':tell', 'Your description is added and your item is in the store!');
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

function getOrderIds(callback) {
  WooCommerce.get('orders?per_page=100', function(err, data, res) {
    if (err) {
      return console.log(err);
    }
    var ids = [];
    var resJSON = JSON.parse(res);
    resJSON.forEach(function(order) {
      ids.push(order.id);
    });
    return callback(ids);
  });
}

function completeOrder(order_id, callback) {
  var data = {
    status: 'completed'
  };
  WooCommerce.post('orders/' + order_id, data, function(err, data, res) {
    if (err) {
      return console.log(err);
    }
    return callback();
  });
}

function getProductReviewSentimentScore(product_id, callback) {
  WooCommerce.get('products/' + product_id + '/reviews', function(err, data, res) {
    if (err) {
      return console.log(err);
    }
    var resJSON = JSON.parse(res);
    var reviews = "";
    resJSON.forEach(function(review) {
      reviews += review.review + " ";
    });
    var rating = sentiment(reviews);
    var score = rating.comparative;
    return callback(score);
  });
}

handlers.BestProductCategory();
