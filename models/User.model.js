const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    fullname:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    city:{
        type: String,
    }
});

userSchema.pre('save', function(next) {
    const user = this;
  
    if (!user.isModified('password')) return next();
  
    bcrypt.genSalt(10, function(err, salt) {
      if (err) return next(err);
  
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);
  
        user.password = hash;
        next();
      });
    });
  });

  userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
    });
  };
module.exports = mongoose.model('User', userSchema);;