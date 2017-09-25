'use strict';

var json2csv = require('json2csv');
var START_MONTH_ERROR = {error: { code: 1, message: "Start month must be provided and must be greater than 0"}};

exports.financial_period = function(req, res, next){
    let config = getConfig(req);

    if(config.start_month == undefined || config.start_month == "" || config.start_month < 1){
        return next(START_MONTH_ERROR);        
    }

    let d_date = Date.parse(config.eval_date);

    if(d_date == NaN){
        console.log("nan error");
    }

    d_date = new Date(d_date);

    var resp_obj = caluclate_period(config.start_month, d_date);

    switch(config.output){
        case "json" :
            json_response(resp_obj, res);
            break;
        case "csv" :
            csv_response(resp_obj, res);
            break;
        default:
            json_response(resp_obj, res);
            break;
    }

    next();
};

exports.financial_period_timeslice = function(req, res, next){
    let config = getConfig(req);
    
    if(config.start_month == undefined || config.start_month == "" || config.start_month < 1){
        return next(START_MONTH_ERROR);        
    }

    let start_date = new Date(config.eval_date);
    let slices = Array(config.slices);
    let i = 0;

    for(i = 0; i < slices.length; ++i){
        slices[i] = caluclate_period(config.start_month, start_date, config.resolution);
        switch(config.resolution){
            case "day" :
                start_date.setDate(start_date.getDate() + 1);
                break;
            case "month" :
                start_date.setMonth(start_date.getMonth() + 1);
                break;
            default :
                start_date.setMonth(start_date.getMonth() + 1);
                break;
        }
    }

    switch(config.output){
        case "json" :
            json_response(slices, res);
            break;
        case "csv":
            csv_response(slices, res);
            break;
        default:
            json_response(slices, res);
            break;
    }

    next();

}

function getConfig(req){
    var config = {};
    config.start_month = req.query.start_month;
    config.eval_date = req.query.date || Date.now().toString() ;
    config.output = req.query.output || "json";
    config.slices = req.query.slices || 12;
    config.resolution = req.query.resolution || "month";

    config.slices = parseInt(config.slices);

    return config;
}

function caluclate_period(start_month, eval_date, idlevel){
    let fy = 0;
    let fq = 0;

    let corrected_month = parseInt(eval_date.getMonth()) - start_month + 2;
    if(corrected_month <= 0){
        fq = Math.ceil((12 + corrected_month)/3);
    }else{
        fq = Math.ceil(corrected_month/3); 
    }

    if(parseInt(eval_date.getMonth()) >= parseInt(start_month - 1)){
        fy = parseInt(eval_date.getFullYear()) + 1;
    }else{
        fy = parseInt(eval_date.getFullYear());
    }

    let shortFy = fy.toString().substring(2);

    let id = eval_date.getFullYear().toString() + (eval_date.getMonth() + 1).toString();
    if(idlevel == "day") id += eval_date.getDate().toString();

    return {
        id :  id,
        fy : fy, 
        short_fy: shortFy, 
        fq : fq, 
        period_string : "FY" + fy + "Q" + fq, 
        short_string: "FY" + shortFy + "Q" + fq };
}

function json_response(data, res){
    res.json(data);    
}

function csv_response(data, res){
    var fields = ["id", "fy", "short_fy", "fq", "period_string", "short_string"];

    var csv = json2csv({data:data, fields:fields});

    res.attachment("financial_period.csv");
    res.send(csv);
}