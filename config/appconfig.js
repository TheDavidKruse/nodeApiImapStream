module.exports = function(){
    console.log('NODE_ENV', process.env.NODE_ENV);
    let environment = process.env.NODE_ENV || "development";
    console.log("environment", environment);
    let config = require(`./appconfig.${environment}`);
    return config;
}() 