// Gab0 method of stacking strategies.
// two RSI_BULL_BEAR that are consulted depending on SMA result
// this concept is a sample, this is entirely customizable
// RSI_BULL_BEAR by @TommieHansen, sample concept by @BradT7

var _ = require('lodash');
var log = require('../core/log.js');

// all used child strategies are "required"
var RBB = require('./RSI_BULL_BEAR.js')

var method = {};
method.init = function() {

    this.age = 0;

    this.currentTrend;
    this.requiredHistory = 20;

  // this SMA will choose wich RSI_BULL_BEAR will be asked for advice;
  // this is a part of this sample concept and is changeable;
  this.selector = this.addIndicator('selector', 'SMA', this.settings.selectorWeight);

   // here we init child strategies. 
   // take note that each one takes corresponding subdict of this.settings;
   this.RBB1 = this.createChild("RSI_BULL_BEAR", this.settings.RBB1);
   this.RBB2 = this.createChild("RSI_BULL_BEAR", this.settings.RBB2);

}


// what happens on every new candle?
method.update = function(candle) {
/*
    this.rsi = this.indicators.rsi.result;
    this.RSIhistory.push(this.rsi);

    if(_.size(this.RSIhistory) > this.interval)
		    // remove oldest RSI value
		    this.RSIhistory.shift();*/

}


method.log = function() {
    // for debugging purposes;;;

}

method.cloneCandle = function(candle) {
//well, some strategies take candle as argument of method.check, some get externally
//as method.candle SOMEHOW; this may be not necessary at all just a reminder - Gab0
return JSON.parse(JSON.stringify(candle));

}


method.check = function(candle) {

    var Selector = this.indicators.selector.result;
    //strategies have to tick on each main strat tick, else they lag behind
    //btw would be genius stuff to be able to skip this, to just "update". only ticking when necessary
    // (guess its impossible)

    // so all child strats should tick here; 
    //note that some strats take candle, some take price which would be candle.close here.
    this.RBB1.tick(candle);
    this.RBB2.tick(candle);


    // now our strategy logic of selecting the consultant RBB;
    if (Selector > this.settings.selectorThreshold)
    {
        if (this.RBB1.lastAdvice)
            this.advice(this.RBB1.lastAdvice.recommendation);
    }
    else
    {
        if (this.RBB2.lastAdvice)
            this.advice(this.RBB2.lastAdvice.recommendation);
    }



    // clear advices for each child strategy!
    this.RBB1.lastAdvice = false;
    this.RBB2.lastAdvice = false;

	// and thats it;
}

// BELOW METHODS ARE INNER WORKINGS AND NOT INTERESTING FOR A STRATEGY DESIGNER;
method.createChild = function(stratname, settings) {
    //  REPRODUCE STEPS ON gekko/plugins/tradingAdvisor.js

    var Consultant = require('../plugins/tradingAdvisor/baseTradingMethod');

    var stratMethod = require('./'+stratname+'.js');

    _.each(stratMethod, function(fn, name) {
        Consultant.prototype[name] = fn;
    });

    Consultant.prototype.collectAdvice = function(advice)
    {
        this.lastAdvice = advice;

    }
    var Strategy = new Consultant(settings);

    Strategy.on('advice', Strategy.collectAdvice );

    return Strategy;
}

method.collectAdvice = function(advice)
{
    this.advices.push(advice);
}

module.exports = method;
