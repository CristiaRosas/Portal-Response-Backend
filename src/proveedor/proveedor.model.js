import { Schema, model } from "mongoose";

const proveedorSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  contacto: {
    type: String,
    required: true,
    trim: true,
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  categorias: [{
    type: Schema.Types.ObjectId,
    ref: "Categoria"
  }],
  productos: [{
    type: Schema.Types.ObjectId,
    ref: "Producto"
  }],
  estado: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
});

export default model("Proveedor", proveedorSchema);