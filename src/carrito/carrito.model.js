import { Schema, model } from "mongoose";

const carritoSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // Cada usuario tiene un solo carrito
  },
  productos: [{
    producto: {
      type: Schema.Types.ObjectId,
      ref: "Producto",
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    precioUnitario: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ["activo", "procesando", "finalizado"],
    default: "activo"
  }
}, {
  timestamps: true,
  versionKey: false,
});

// Calcular total antes de guardar
carritoSchema.pre('save', function(next) {
  this.total = this.productos.reduce((sum, item) => sum + item.subtotal, 0);
  next();
});

export default model("Carrito", carritoSchema);