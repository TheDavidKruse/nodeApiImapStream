const fs = require('fs'),
    base64 = require('base64-stream'),
    crypto = require('crypto'),
    Imap = require('imap'),
    inspect = require('util').inspect,
    aws = require('aws-sdk'),
    path = require('path'),
    streamData = require('stream'),
    assets = require('../assets'),
    imapService = require('./imapService'),
    http = require('http');

aws.config.update({
    secretAccessKey: assets.awsInfo.secretAccessKey,
    accessKeyId: assets.awsInfo.accessKeyId
});
aws.config.region = 'us-west-2';

const s3 = new aws.S3({
        apiVersion: '2006-03-01'
    });


const makeNewImapConnection = (loginData) => {
    const imap = new Imap({
            user: loginData.user,
            password: loginData.password,
            // xoauth2: xoauth2Token,
            host: loginData.host,
            tlsOptions: {
                rejectUnauthorized: false
            },
            port: loginData.port,
            tls: true,
            debug: console.log,
            authTimeout: 100000,
            idle: true,
            // keepalive: {
            //     interval: 3600,
            //     idleInterval: 3600,
            //     // forceNoop: true
            // }
        }),
        toUpper = (thing) => {
            return thing && thing.toUpperCase ? thing.toUpperCase() : thing;
        },
        findAttachmentParts = (struct, attachments) => {
            attachments = attachments || [];
            for (let i = 0, len = struct.length, r; i < len; ++i) {
                if (Array.isArray(struct[i])) {
                    findAttachmentParts(struct[i], attachments);
                } else {
                    if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
                        attachments.push(struct[i]);
                    }
                }
            }
            return attachments;
        },
        buildAttMessageFunction = (attachment, fileExtention) => {
            let time = Date.now()
            const hash = crypto.createHash('sha512');
            let filename = hash.update(attachment.params.name + time, 'utf-8');
            let gen_hash = filename.digest('hex');
            let encoding = attachment.encoding;

            return (msg, seqno) => {
                let prefix = '(#' + seqno + ') ';
                msg.on('body', (stream, info) => {
                    let uploadFromStream = (s3) => {
                        const pass = new streamData.PassThrough();

                        const params = {
                            Bucket: assets.awsInfo.Bucket,
                            Key: `${gen_hash+'.'+fileExtention}`,
                            Body: pass
                        };
                        s3.upload(params, (err, data) => {
                            let s3PicName = data.Key;
                            console.log(err, data);
                            imapService.insertData(data)
                                .then((data) => {
                                    console.log('imapservice insertdata successful');
                                })
                                .then(data => {
                                    let options = {
                                            hostname: 'flask-app.s6hhzm7454.us-west-2.elasticbeanstalk.com',
                                            port: 80,
                                            path: '/picture',
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            }
                                        },
                                        request = http.request(options, (res) => {
                                            console.log('Status: ' + res.statusCode);
                                            console.log('Headers: ' + JSON.stringify(res.headers));
                                            res.setEncoding('utf8');
                                            res.on('data', (body) => {
                                                console.log('Body: ' + body);
                                            });
                                        });

                                        request.on('error', (err) => {
                                            console.log(err);
                                        })

                                        request.on('end', () => {
                                            console.log('request closed');
                                        })
                                        console.log('stringified', JSON.stringify(s3PicName));

                                        request.write(JSON.stringify(s3PicName));
                                        request.end();

                                }).catch(err => {
                                    console.log('InsertData Err:', err);
                                })

                        })
                        return pass;
                    }
                    stream.pipe(base64.decode()).pipe(uploadFromStream(s3));

                });
                msg.once('end', () => {
                    console.log(prefix + 'Finished attachment %s', filename);
                });
            };
        },
        getMessageAndDecode = () => {
            imap.search(['UNSEEN'], (err, results) => {
                if (err) {
                    throw err
                } else if (results.length > 0) {
                    let f = imap.fetch(results, {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
                        struct: true
                    });
                    f.on('message', (msg, seqno) => {
                        console.log('Message #%d', seqno);
                        let prefix = '(#' + seqno + ') ';
                        msg.on('body', (stream, info) => {
                            let buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', () => {
                                console.log(prefix + 'Parsed header: %s', Imap.parseHeader(buffer));
                                console.log(Imap.parseHeader(buffer));
                            });
                        });
                        msg.once('attributes', (attrs) => {
                            imap.setFlags([attrs.uid], ['\\Seen'], (err) => {
                                if (err) console.log(err);
                            });
                            let attachments = findAttachmentParts(attrs.struct);
                            console.log('findattachmentparts results', attachments);
                            console.log(prefix + 'Has attachments: %d', attachments.length);
                            for (let i = 0, len = attachments.length; i < len; ++i) {
                                let attachment = attachments[i];
                                /*This is how each attachment looks like {
                                    partID: '2',
                                    type: 'application',
                                    subtype: 'octet-stream',
                                    params: { name: 'file-name.ext' },
                                    id: null,
                                    description: null,
                                    encoding: 'BASE64',
                                    size: 44952,
                                    md5: null,
                                    disposition: { type: 'ATTACHMENT', params: { filename: 'file-name.ext' } },
                                    language: null
                                  }
                                */
                                console.log(prefix + 'Fetching attachment %s', attachment.params.name);
                                let f = imap.fetch(attrs.uid, { //do not use imap.seq.fetch here
                                    bodies: [attachment.partID],
                                    struct: true
                                });
                                let indexOfExt = attachment.params.name.lastIndexOf('.');
                                let fileExtention = attachment.params.name.slice(indexOfExt + 1);
                                //build function to process attachment message
                                f.on('message', buildAttMessageFunction(attachment, fileExtention));
                            }
                        });
                        msg.once('end', () => {
                            console.log(prefix + 'Finished email');
                        });
                    });
                    f.once('error', (err) => {
                        console.log('Fetch error: ' + err);
                    });
                    f.once('end', () => {
                        console.log('Done fetching all messages!');
                    });
                }

            });
        }

    imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
            if (err) throw err;
            getMessageAndDecode();
        });
    });

    imap.on('mail', () => {
        getMessageAndDecode();
    })

    imap.connect();
}

module.exports = makeNewImapConnection
