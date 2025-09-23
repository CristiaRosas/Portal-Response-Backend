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
                msg: 'Credenciales incorrectas, el correo electrónico o nombre de usuario no existe'
            });
        }

        if(!user.state){
            return res.status(400).json({
                msg: 'El usuario no existe en la base de datos.'
            });
        }

        const validPassword = await verify(user.password, password);
        if(!validPassword){
            return res.status(400).json({
                msg: 'La contraseña es incorrecta'
            })
        }

        req.user = user;
        next(); 

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Error del servidor durante la validación del usuario',
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
                msg: 'El correo electrónico ya existe'
            });
        }

        next(); 

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Error del servidor durante la validación del usuario',
            error: error.message
        });
    }
}       