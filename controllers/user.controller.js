const User = require('../models/User.model');

//create new User
exports.createUser = async(req,res)=>{
    try {
        const user = new User(req.body);
        await user.save();
        return res.status(200).json(user); 
    } catch (error) {
        res.sendStatus(400);
    }
}

//user login
exports.loginUser = async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).send({ error: 'User not found with that email' });
      }
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (!!err || !isMatch) {
            console.log(err);
          return res.status(400).send({ error: err});
        }
        res.send(user);
      });
    } catch (error) {
        console.log(error);
      res.status(500).send(error);
    }
  }