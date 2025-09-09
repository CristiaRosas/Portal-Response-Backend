import Role from '../role/role.model.js'
import User from '../users/user.model.js'

export const esRoleValido = async (role = '') => {

    const existeRol = await Role.findOne({ role });

    if(!existeRol){
        throw new Error(`The role ${ role } does not exist in the database`);
    }
}

export const existeEmail = async(email = '') =>{
    const existeEmail = await User.findOne({ email });
    
    if(existeEmail){
        throw new Error(`The email ${ email } already exists in the database`)
    }
}

export const existeUsuarioById = async (id = '') => {
    const existeUsuario = await User.findById(id);

    if(!existeUsuario){
        throw new Error(`The id ${id} does not exist`);
    }
}