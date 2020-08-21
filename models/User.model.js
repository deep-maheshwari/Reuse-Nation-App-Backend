const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email provided is invalid')
            }
        }
    },
    phone:{
        type: Number,
        required: true,
        unique: true,
        validate(value){
            if(value.toString().length!==10){
                throw new Error('Phone number provided is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
    },
    dp_url:{type: String, required:true},
    tokens:[{
        token: {
            type: String,
            required: true
        }
    }],
},{
    timestamps: true,
})

userSchema.methods.generateAuthToken = async function () {
    const user = this
    // const token = jwt.sign({_id:user._id.toString()}, process.env.JWT_SECRET, {expiresIn: "8 days"})
    const token = jwt.sign({_id:user._id.toString()}, 'thisismysecret', {expiresIn: "8 days"})

    user.tokens = user.tokens.concat({ token })
    await user.save() 
    return token
}

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.statics.findByCredentials = async (email,password) => {
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to Login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Unable to Login')
    }

    return user
}

//hash the password
userSchema.pre('save',async function (next) {
    const user = this
    
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const User = mongoose.model('User',userSchema)
module.exports = User

