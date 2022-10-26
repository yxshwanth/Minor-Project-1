const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const ClubSchema = new mongoose.Schema({
    clubName: {
        type : String,
        required: true
    },
    email: {
        type : String,
        unique: true,

    },
    password: {
        type: String,
        required: [true, "Please add a Password"],
        minlength :6,
        select:false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
})
ClubSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt)
    next();
})

ClubSchema.methods.matchPasswords = async function(password) {
    return await bcrypt.compare(password, this.password)
}


ClubSchema.methods.getSignedToken = function() {
    return jwt.sign({id : this._id}, process.env.JWT_SECRET, { expiresIn : process.env.JWT_EXPIRE})
}


ClubSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString("hex")

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    this.resetPasswordExpire = Date.now() + 10*(60*1000);


    return resetToken
}

const Club = mongoose.model("Club", ClubSchema)

module.exports = Club