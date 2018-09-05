const express = require('express');
const router = express.Router();
const makeNewImapConnection = require('./../services/makeNewImapConnection');

/* GET home page. */
router.post('/make', (req, res, next) => {
	console.log(req.body)
    makeNewImapConnection(req.body)
    res.status(200).send({
        msg: 'api endpoint created'
    });
});

router.post('/', (req,res,next)=> {
	console.log(req.body)
	res.status(200).send({

	})
})

module.exports = router;
