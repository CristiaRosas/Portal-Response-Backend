import { Schema, model } from "mongoose";

const pedidoSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productos: [
    {
      producto: {
        type: Schema.Types.ObjectId,
        ref: "Producto",
        required: true,
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1,
      },
      precioUnitario: {
        type: Number,
        required: true,
      }
      // ELIMINADO: estado individual de productos
    }
  ],
  // Estados del PEDIDO COMPLETO (lo que ve el usuario)
  estado: {
    type: String,
    enum: ["pendiente", "confirmado", "en preparacion", "en camino", "entregado", "cancelado"],
    default: "pendiente"
  },
  total: {
    type: Number,
    required: true,
  },
  direccionEntrega: {
    type: String,
    required: true,
  },
  telefonoContacto: {
    type: String,
    required: true,
  },
  observaciones: {
    type: String,
    maxLength: 500,
  },
  historialEstados: [{
    estado: String,
    fecha: {
      type: Date,
      default: Date.now
    },
    observaciones: String,
    cambiadoPor: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  }]
}, {
  timestamps: true,
  versionKey: false,
});

export default model("Pedido", pedidoSchema);