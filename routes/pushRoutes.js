const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/test', (req, res, next) => {
	console.log(req.body)
    res.status(200).send({
      msg: 'api endpoint found'
    });
});

router.post('/', (req,res,next)=> {
	console.log(req.body)
	res.status(200).send({

	})
})

module.exports = router;
