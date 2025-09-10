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
      },
      proveedor: {
        type: Schema.Types.ObjectId,
        ref: "Proveedor",
        required: true,
      },
      estado: {
        type: String,
        enum: ["pendiente", "confirmado", "en_preparacion", "en_camino", "entregado", "cancelado"],
        default: "pendiente",
      },
      fechaActualizacion: {
        type: Date,
        default: Date.now,
      }
    }
  ],
  estadoGeneral: {
    type: String,
    enum: ["pendiente", "parcial", "completado", "cancelado"],
    default: "pendiente",
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

// Middleware para actualizar estado general
pedidoSchema.pre('save', function(next) {
  const estados = this.productos.map(p => p.estado);
  
  if (estados.every(e => e === "entregado")) {
    this.estadoGeneral = "completado";
  } else if (estados.some(e => e !== "pendiente")) {
    this.estadoGeneral = "parcial";
  } else if (estados.every(e => e === "cancelado")) {
    this.estadoGeneral = "cancelado";
  } else {
    this.estadoGeneral = "pendiente";
  }
  
  next();
});

export default model("Pedido", pedidoSchema);