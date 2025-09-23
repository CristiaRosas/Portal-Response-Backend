import User from '../users/user.model.js';
import { hash, verify } from 'argon2';
import { generarJWT } from '../helpers/generate-jwt.js';

export const login = async(req, res) => {

    try {

        const user = req.user; 
        const token = await generarJWT(user.id);

        return res.status(200).json({
            msg: 'Inicio de sesión exitosa',
            userDetails: {
                name: user.name,
                surname: user.surname,
                username: user.username,
                email: user.email,
                token: token,
                role: user.role,
                _id : user._id
            }
        });

    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Error del servidor",
            error: e.message
        })
    }
}

export const register = async (req, res) => {
    try {
        const data = req.body; 

        const existingUser = await User.findOne({ 
            $or: [
                { email: data.email.trim() },
                { username: data.username }
            ] 
        });

        if (existingUser) {
            return res.status(400).json({
                message: "El correo electrónico o nombre de usuario ya existe",
                error: "ENTRADA DUPLICADA"
            });
        }

        const encryptedPassword = await hash(data.password);

        const user = await User.create({
            name: data.name,
            surname: data.surname,
            username: data.username,
            email: data.email.trim(), 
            password: encryptedPassword
        })

        return res.status(200).json({
            message: "Usuario registrado exitosamente",
            userDetails: {
                user: user.email
            }
        })

    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: "El correo electrónico o nombre de usuario ya existe",
                error: "ENTRADA DUPLICADA"
            });
        }
        return res.status(500).json({
            message: "Error al crear el usuario",
            error: error.message
        });
    }
}


const createAdmin = async ( name, surname, username, email, password, role ) => {
    try {

        if (role === "APP_ADMIN") {
            const existAdmin = await User.findOne({ role: "APP_ADMIN" });
            if (existAdmin) {
                console.log("Ya existe un usuario con rol de administrador. No se puede crear otro.");
                return null;
            };
        };

    const encryptedPassword = await hash(password);

    const newUser = new User({ 
        name, 
        surname, 
        username, 
        email, 
        password: encryptedPassword, 
        role });

        await newUser.save();
        console.log("Usuario creado con éxito:", newUser);
        return newUser;
        
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        return null;
    }
}

createAdmin("Cristian", "Rene", "Rosas","crosas@gmail.com", "12345678", "APP_ADMIN");
