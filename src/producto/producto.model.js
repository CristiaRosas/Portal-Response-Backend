import { Schema, model } from "mongoose";

const productoSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  precio: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  categoria: {
    type: Schema.Types.ObjectId,
    ref: "Categoria",
    required: true
  },
  proveedor: {
    type: Schema.Types.ObjectId,
    ref: "Proveedor"
  }
}, {
  timestamps: true,
  versionKey: false,
});

export default model("Producto", productoSchema);