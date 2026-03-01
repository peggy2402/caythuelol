import mongoose, { Schema, Model, models } from "mongoose";

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export interface IOrder {
  customerId: mongoose.Types.ObjectId;
  boosterId?: mongoose.Types.ObjectId;
  serviceType: string;
  status: OrderStatus;
  pricing: {
    total_amount: number;
    base_price: number;
    option_fees: number;
  };
  details: any;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    boosterId: { type: Schema.Types.ObjectId, ref: "User" },
    serviceType: { type: String, required: true },
    status: { 
      type: String, 
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT
    },
    pricing: {
      total_amount: { type: Number, required: true },
      base_price: Number,
      option_fees: Number
    },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = models.Order || mongoose.model("Order", OrderSchema);
export default Order;