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
      }
    }
  ],
  estado: {
    type: String,
    enum: ["pendiente", "procesando", "completado", "cancelado"],
    default: "pendiente",
  },
  total: {
    type: Number,
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  versionKey: false,
});

export default model("Pedido", pedidoSchema);