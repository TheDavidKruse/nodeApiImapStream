const pg = require('pg'),
    appconfig = require('../config/appconfig');
const insertData = (data) => {
    let client = new pg.Client(appconfig.postgres.postgresdev);
    const promise = new Promise((resolve, reject) => {
        try{
            client.connect();
        } catch(e){
            console.log('try catch err:', e);
        }

        const sql = `insert into development.non_po_invoice (document_id) values ('${data.Key}')`;

        client.query(sql).then(res => {
            console.log(`successfully inserted document ${res.rows[0]}`);
            resolve(res.rows[0]);
        }).catch(err => {
            console.log(`err inserting document ${data.key}, err: ${err}`);
        });
    });

    return promise;
}

module.exports = {
    insertData
}
