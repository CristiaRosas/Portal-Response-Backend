import User from '../users/user.model.js';
import { verify } from 'argon2';

export const validateUserExistsEmail = async (req, res, next) => {
    const { email, password, username } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (!user) {
            return res.status(400).json({
                msg: 'Incorrect credentials, Email or Username does not exist'
            });
        }

        if(!user.state){
            return res.status(400).json({
                msg: 'The user does not exist in the database'
            });
        }

        const validPassword = await verify(user.password, password);
        if(!validPassword){
            return res.status(400).json({
                msg: 'The password is incorrect'
            })
        }

        req.user = user;
        next(); 

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Server error during user validation',
            error: error.message
        });
    }
};

export const validateExistingUser = async (req, res, next) => {
    const {email} = req.body;

    try {

        const existingUser = await User.findOne({ email: email.trim() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                msg: 'Email already exists'
            });
        }

        next(); 

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Server error during user validation',
            error: error.message
        });
    }
}