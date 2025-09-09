import {Schema, model} from "mongoose";

const UserSchema = Schema({
    name : {
        type: String,
        required: [true, 'Name required'],
        maxLength: [25, 'Cant be overcome 25 characters']
    },
    surname : {
        type: String,
        required: [true, 'Surname required'],
        maxLength: [25, 'Cant be overcome 25 characters']
    },
    username : {
        type: String,
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Email required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password required'],
        minLength: 8
    },
    bookingHistory: [
        {
            type: Object,
            required: false
        }
    ],
    role: {
        type: String,
        required: true,
        enum: ['APP_ADMIN', 'NORMAL_ROLE'],
        default: 'NORMAL_ROLE'
    },
    state: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
        versionKey: false,
    }
);

UserSchema.methods.toJSON = function() {
    const {__v, password, _id, ...usuario} = this.toObject();
    usuario.uid = _id;
    return usuario;
}

export default model('User', UserSchema);