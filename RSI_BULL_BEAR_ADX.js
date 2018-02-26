/*
	RSI Bull and Bear + ADX modifier
	1. Use different RSI-strategies depending on a longer trend
	2. But modify this slighly if shorter BULL/BEAR is detected
	-
	12 feb 2017
	-
	(CC-BY-SA 4.0) Tommie Hansen
	https://creativecommons.org/licenses/by-sa/4.0/
*/

// req's
var log = require ('../core/log.js');
var config = require ('../core/util.js').getConfig();

// strategy
var strat = {
	
	/* INIT */
	init: function()
	{
		this.name = 'RSI Bull and Bear ADX';
		this.requiredHistory = 10//config.tradingAdvisor.historySize;
		this.resetTrend();		
		
		// debug? set to flase to disable all logging/messages/stats (improves performance)
		this.debug = true;
		
		// performance
		//config.backtest.batchSize = 1000; // increase performance
		//config.silent = true;
		//config.debug = false;
		
		// SMA
		this.addIndicator('maSlow', 'SMA', this.settings.SMA_long );
		this.addIndicator('maFast', 'SMA', this.settings.SMA_short );
		
		// RSI
		this.addIndicator('BULL_RSI', 'RSI', { interval: this.settings.BULL_RSI });
		this.addIndicator('BEAR_RSI', 'RSI', { interval: this.settings.BEAR_RSI });
		
		// ADX
		this.addIndicator('adx', 'ADX', this.settings.ADX )
		
		
		// debug stuff
		this.startTime = new Date();
		
		// add min/max if debug
		if( this.debug ){
			this.stat = {
				adx: { min: 1000, max: 0 },
				bear: { min: 1000, max: 0 },
				bull: { min: 1000, max: 0 }
			};
		}
		
	}, // init()
	
	
	/* RESET TREND */
	resetTrend: function()
	{
		var trend = {
			duration: 0,
			direction: 'none',
			longPos: false,
		};
	
		this.trend = trend;
	},
	
	
	/* get low/high for backtest-period */
	lowHigh: function( val, type )
	{
		let cur;
		if( type == 'bear' ) {
			cur = this.stat.bear;
			if( val < cur.min ) this.stat.bear.min = val; // set new
			else if( val > cur.max ) this.stat.bear.max = val;
		}
		else if( type == 'bull' ) {
			cur = this.stat.bull;
			if( val < cur.min ) this.stat.bull.min = val; // set new
			else if( val > cur.max ) this.stat.bull.max = val;
		}
		else {
			cur = this.stat.adx;
			if( val < cur.min ) this.stat.adx.min = val; // set new
			else if( val > cur.max ) this.stat.adx.max = val;
		}
	},
	
	
	/* CHECK */
	check: function()
	{
		// get all indicators
		let ind = this.indicators,
			maSlow = ind.maSlow.result,
			maFast = ind.maFast.result,
			adx = this.indicators.adx.result;
		
		
			
		// BEAR TREND
		if( maFast < maSlow )
		{
			rsi = ind.BEAR_RSI.result;
			let rsi_hi = this.settings.BEAR_RSI_high,
				rsi_low = this.settings.BEAR_RSI_low;
			
			// ADX trend strength?
			if( adx > this.settings.ADX_high ) rsi_hi = rsi_hi + 15;
			else if( adx < this.settings.ADX_low ) rsi_low = rsi_low -5;
				
			if( rsi > rsi_hi ) this.short();
			else if( rsi < rsi_low ) this.long();
			
			if(this.debug) this.lowHigh( rsi, 'bear' );
		}

		// BULL TREND
		else
		{
			rsi = ind.BULL_RSI.result;
			let rsi_hi = this.settings.BULL_RSI_high,
				rsi_low = this.settings.BULL_RSI_low;
			
			// ADX trend strength?
			if( adx > this.settings.ADX_high ) rsi_hi = rsi_hi + 5;		
			else if( adx < this.settings.ADX_low ) rsi_low = rsi_low -5;
				
			if( rsi > rsi_hi ) this.short();
			else if( rsi < rsi_low )  this.long();
			if(this.debug) this.lowHigh( rsi, 'bull' );
		}
		
		// add adx low/high if debug
		if( this.debug ) this.lowHigh( adx, 'adx');
	
	}, // check()
	
	
	/* LONG */
	long: function()
	{
		if( this.trend.direction !== 'up' ) // new trend? (only act on new trends)
		{
			this.resetTrend();
			this.trend.direction = 'up';
			this.advice('long');
			if( this.debug ) log.info('Going long');
		}
		
		if( this.debug )
		{
			this.trend.duration++;
			log.info('Long since', this.trend.duration, 'candle(s)');
		}
	},
	
	
	/* SHORT */
	short: function()
	{
		// new trend? (else do things)
		if( this.trend.direction !== 'down' )
		{
			this.resetTrend();
			this.trend.direction = 'down';
			this.advice('short');
			if( this.debug ) log.info('Going short');
		}
		
		if( this.debug )
		{
			this.trend.duration++;
			log.info('Short since', this.trend.duration, 'candle(s)');
		}
	},
	
	
	/* END backtest */
	end: function()
	{
		let seconds = ((new Date()- this.startTime)/1000),
			minutes = seconds/60,
			str;
			
		minutes < 1 ? str = seconds.toFixed(2) + ' seconds' : str = minutes.toFixed(2) + ' minutes';
		
		log.info('====================================');
		log.info('Finished in ' + str);
		log.info('====================================');
	
		// print stats and messages if debug
		if(this.debug)
		{
			let stat = this.stat;
			log.info('BEAR RSI low/high: ' + stat.bear.min + ' / ' + stat.bear.max);
			log.info('BULL RSI low/high: ' + stat.bull.min + ' / ' + stat.bull.max);
			log.info('ADX min/max: ' + stat.adx.min + ' / ' + stat.adx.max);
		}
		
	}
	
};

module.exports = strat;
