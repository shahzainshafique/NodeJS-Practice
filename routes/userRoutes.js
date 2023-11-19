const express = require('express');

const {createUser, loginUser} = require("../controllers/user.controller");
const router = express.Router();

router.route('/signup').post(createUser);
router.route('/login').post(loginUser);
router.route('/').get((req,res)=>res.send("Hi,Me here"))
module.exports = router;