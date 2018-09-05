const postgresdev = {
    user:"Login name for db server",
    host:"hostname for db server",
    database: "dbname",
    password:"password for db",
    port:5432
}

const postgresprod = {
    user:"Login name for db server",
    host:"hostname for db server",
    database: "dbname",
    password:"password for db",
    port:5432
}

const awsInfo = {
    Bucket:'aws bucket for images to be sent to',
    secretAccessKey: 'aws secret access key',
    accessKeyId: " aws access key"
}

module.exports = {
    postgresprod,
    postgresdev,
    awsInfo
};
