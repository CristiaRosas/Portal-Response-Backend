import { response } from "express";
import { hash, verify } from "argon2";
import User from './user.model.js';

export const usersView = async (req, res = response) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        const query = { state: true };

        const users = await User.find(query)
            .skip(Number(desde))
            .limit(Number(limite));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "Error al obtener usuarios",
            error: error.message
        });
    }
};

export const updateUser = async (req, res = response) => {
    try {
        const id = req.usuario._id; 
        const { _id, password, email, username, role, ...data } = req.body;

        const restrictedFields = ['email', 'username', 'role', 'password'];
        const attemptedRestrictedUpdate = Object.keys(req.body).some(field => 
            restrictedFields.includes(field)
        );

        if (attemptedRestrictedUpdate) {
            return res.status(400).json({
                success: false,
                msg: 'No se puede actualizar el correo electrónico, el nombre de usuario, el rol ni la contraseña directamente. Utilice puntos de conexión específicos para estas operaciones..'
            });
        }
        const user = await User.findByIdAndUpdate(
            id, 
            data, 
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            msg: 'Usuario actualizado con éxito',
            user: {
                name: user.name,
                surname: user.surname,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error al actualizar el usuario',
            error: error.message
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const id = req.usuario._id;
        const { passwordNew } = req.body;

        const passwordUpdate = await hash(passwordNew);
        await User.findByIdAndUpdate(id, { password: passwordUpdate });

        res.status(200).json({
            success: true,
            msg: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            success: false,
            msg: 'No se pudo actualizar la contraseña',
            error: error.message
        });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await User.findByIdAndUpdate(id, { state: false });

        res.status(200).json({
            success: true,
            message: 'Usuario deshabilitado exitosamente',
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error al eliminar usuario',
            error: error.message,
        });
    }
};

export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['APP_ADMIN', 'NORMAL_ROLE'].includes(role)) {
            return res.status(400).json({
                success: false,
                msg: 'Rol no válido. Debe ser APP_ADMIN o NORMAL_ROLE.'
            });
        }

        const user = await User.findByIdAndUpdate(
            id, 
            { role }, 
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            msg: 'Rol de usuario actualizado exitosamente',
            user
        });
    } catch (error) {
        console.error('Error al actualizar el rol del usuario:', error);
        res.status(500).json({
            success: false,
            msg: 'No se pudo actualizar el rol del usuario',
            error: error.message
        });
    }
};