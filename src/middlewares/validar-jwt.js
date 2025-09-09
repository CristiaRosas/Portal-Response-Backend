import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';

export const validarJWT = async(req, res, next) =>{
    const token = req.header('x-token');

    if(!token){
        return res.status(401).json({
            msg: 'There is no token in the request'
        })
    }

    try{
        const { uid } = jwt.verify(token, process.env.SECRETPRIVATEKEY);
        const usuario = await User.findById(uid);

        if(!usuario){
            return res.status(401).json({
                msg: 'User does not exist in the database'
            })
        }

        if(!usuario.state){
            return res.status(401).json({
                msg: 'Invalid token - user in state: false'
            })
        }

        req.usuario = usuario;

        next();

    }catch (e){
        console.log(e);
        res.status(401).json({
            msg: 'Invalid token'
        })
    }
}