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
    }
  ],
  // Corregido: hacerlo requerido pero con valor por defecto
  codigoSeguimiento: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return generarCodigoSeguimiento();
    }
  },
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

// Función para generar código de seguimiento único
function generarCodigoSeguimiento() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default model("Pedido", pedidoSchema);