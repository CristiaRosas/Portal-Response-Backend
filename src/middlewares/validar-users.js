import User from '../users/user.model.js';
import { verify } from 'argon2';

export const preventEmailOrPasswordUpdate = (req, res, next) => {
    const { password, email } = req.body;
    if (password || email) {
        return res.status(400).json({
            success: false,
            message: 'No se puede actualizar la contraseña o el correo electrónico directamente',
        });
    }
    next();
};

export const validateOldPassword = async (req, res, next) => {
    try {
        const { passwordOld } = req.body;
        const user = await User.findById(req.usuario._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: 'Usuario no encontrado'
            });
        }

        const validPassword = await verify(user.password, passwordOld);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'La contraseña actual es incorrecta'
            });
        }

        req.user = user; 
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error al validar la contraseña actual',
            error: error.message
        });
    }
};

export const confirmDeletionMiddleware = (req, res, next) => {
    const { confirmDeletion } = req.body;
    if (!confirmDeletion) {
        return res.status(400).json({
            success: false,
            msg: 'Por favor, confirme la acción de eliminación'
        });
    }
    next();
};

export const validateUserOnlyDelete = async (req, res, next) => {
    try {
        const { password } = req.body;
        const { id } = req.params;
        const authenticatedUserId = req.usuario.id; 

        if (id !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                msg: 'Sólo puedes eliminar tu propia cuenta'
            });
        }

        const validPassword = await verify(req.usuario.password, password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'La contraseña actual es incorrecta'
            });
        } else {
            await User.findByIdAndUpdate(id, { state: false });
        };

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error al validar el usuario para su eliminación',
            error: error.message
        });
    }
};

export const validateUserExists = async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({
            success: false,
            msg: 'Usuario no encontrado'
        });
    } 
    next();
};

export const validateUserRole = (req, res, next) => {
    const { role } = req.body;
    const validRoles = ['APP_ADMIN', 'NORMAL_ROLE'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            msg: 'Rol no válido. Roles permitidos: APP_ADMIN, NORMAL_ROLE'
        });
    }
    next();
};