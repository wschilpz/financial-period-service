'use strict';
module.exports = function(app){

    var fp_calculator = require('./services.js');

    app.route('/api/financialperiod')
        .get(fp_calculator.financial_period);

    app.route('/api/financialperiodslices')
        .get(fp_calculator.financial_period_timeslice);
}