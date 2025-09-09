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
            msg: "Error getting users",
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
                msg: 'Cannot update email, username, role or password directly. Use specific endpoints for these operations.'
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
                msg: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            msg: 'User updated successfully',
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
            msg: 'Error updating user',
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
            msg: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to update password',
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
            message: 'User disabled successfully',
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error deleting user',
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
                msg: 'Invalid role. Must be APP_ADMIN or NORMAL_ROLE'
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
                msg: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            msg: 'User role updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to update user role',
            error: error.message
        });
    }
};