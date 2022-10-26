const crypto = require('crypto');
const { userInfo } = require('os');

const Club = require('../models/Club')
const ErrorResponse = require("../utils/errorResponse")
const sendEmail =   require('../utils/sendEmail')

exports.register = async (req, res, next) =>{
    const {clubName, email, password} = req.body;
    try {
        const club = await Club.create({
            clubName, email, password
        });
        sendToken(club, 201, res)
    } catch(err){
        next(err)
    }
};

exports.login = async (req, res, next) =>{
    const {email, password} = req.body;

    if(!email || !password) {
        return next(new ErrorResponse("Please Provide an Email And Password", 400))
    }

    try{
        const club = await Club.findOne({email}).select("+password");
        if(!club) {
            return next(new ErrorResponse("User not Found!!", 404))
        }

        const isMatch = await club.matchPasswords(password)
        
        if(!isMatch){
            return next(new ErrorResponse("Invalid Credentials", 401))
        }

        sendToken(club, 200, res)

        
    } catch(err){
        next(err)
    }
    
    
    // res.send("Login Route");
};

exports.forgotPassword = async (req, res, next) =>{
    // res.send("Forgot Password Route");
    const {email} = req.body;
    try {
        const club = await Club.findOne({email})
        if(!club){
            return next(new ErrorResponse("Email Could not be sent", 404))
        }

        const resetToken = club.getResetPasswordToken()

        await club.save()

        const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

        const message = `
        <h1>You have requested a password reset</h1>
        <p>Please go to this link to reset your password</p>
        <a href=${resetUrl} clicktracking = off>${resetUrl}</a>
        `
        try {
            await sendEmail({
                to: club.email,
                subject: "Password Reset Request",
                text: message
            })
            res.status(200).json({success: true, data:"Email Sent"});
        } catch (err) {
            club.resetPasswordToken = undefined;
            club.resetPasswordExpire = undefined;


            await club.save()

            return next(new ErrorResponse("Email Couldnt be sent", 500))
        }

    } catch (err) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) =>{
    // res.send("Reset Password Route");
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex")

    try {
        const club = await Club.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        })
        if(!club){
            return next(new ErrorResponse("Invalid Reset token", 400))
        }

        club.password = req.body.password;
        club.resetPasswordToken = undefined;
        club.resetPasswordExpire = undefined;

        await club.save()

        res.status(201).json({
            succes:true,
            data:"Password reset success"
        })

    } catch (err) {
        next(Err)
    }
};


const sendToken = (club, statusCode, res)=>{
    const token = club.getSignedToken()
    res.status(statusCode).json({success:true, token})
}
