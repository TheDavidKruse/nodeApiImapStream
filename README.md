So this is kind of a failed project that was supposed to be paired with my brother. This is a node application that:

1.) Waits for a user's email to recieve a message
2.) check to see if that email has an image/pdf attachment
3.) if the email does have an image/pdf attachment is streams that image from the gmail imap server, through a passthrough stream, into an s3 bucket and also sends a post request (with am image name cryptographically generated) to another server that looks at the image name and pulls it from the s3 bucket
4.) the 2nd server performs ocr on that image and pulls out relevant data
5.) data from the image is sent back to this api

Now hopefully this allows some people to get some help with chunking with buffers and streaming them using a passthrough stream.

If this helped you, please feel free to copy and paste this code wherever you need it :)


Things to keep in mind:
* you need to make sure to change the assets.js file with relevant information if you need it.
* if you do not use aws you will need to change some of the services and routes within the imap routes file
* you need to change the credentials json file to your imap user's specific credentials from gmail. If you want to use a different imap server you may have to configure this to use your specific imap server

-David Kruse