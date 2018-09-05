const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 8000;
const cors = require('cors');
const logger = require('morgan');
const appconfig = require('./config/appconfig')

const push = require('./routes/pushRoutes');
const imap = require('./routes/imapRoutes');

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/push', push);
app.use('/imap', imap);


app.listen(port, () => {
  console.log("listening on port: ", port);
})
