const jwt = require('jsonwebtoken');
const Club = require('../models/Club');
const ErrorResponse = require('../utils/errorResponse');

exports.protect = async(req, res, next)=>{
    let token;

    if(req.headers.authorization && 
        req.headers.authorization.startsWith("Bearer")){
        // Bearer 234ikj35987ydf9876
        token = req.headers.authorization.split(" ")[1]
    }

    if(!token){
        return next(new ErrorResponse("Not authorized to access this route", 401))
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const club = await Club.findById(decoded.id);

        if(!club){
            return next(new ErrorResponse("No User Found with this Id", 404));
        }

        req.club = club

        next();

    } catch (err) {
        return next(new ErrorResponse("Not Authorized to access this route"))
    }


}