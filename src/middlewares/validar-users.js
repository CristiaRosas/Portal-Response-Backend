import User from '../users/user.model.js';
import { verify } from 'argon2';

export const preventEmailOrPasswordUpdate = (req, res, next) => {
    const { password, email } = req.body;
    if (password || email) {
        return res.status(400).json({
            success: false,
            message: 'Cannot update password or email directly',
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
                msg: 'User not found'
            });
        }

        const validPassword = await verify(user.password, passwordOld);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'The current password is incorrect'
            });
        }

        req.user = user; 
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error validating current password',
            error: error.message
        });
    }
};

export const confirmDeletionMiddleware = (req, res, next) => {
    const { confirmDeletion } = req.body;
    if (!confirmDeletion) {
        return res.status(400).json({
            success: false,
            msg: 'Please confirm the deletion action'
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
                msg: 'You can only delete your own account'
            });
        }

        const validPassword = await verify(req.usuario.password, password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                msg: 'The current password is incorrect'
            });
        } else {
            await User.findByIdAndUpdate(id, { state: false });
        };

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: 'Error validating user for deletion',
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
            msg: 'User not found'
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
            msg: 'Invalid role. Allowed roles: APP_ROLE, NORMAL_ROLE'
        });
    }
    next();
};