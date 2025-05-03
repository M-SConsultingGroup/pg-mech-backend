import { Schema, model, Document } from 'mongoose';
import { Ticket } from '@/common/interfaces';
import { TICKET_STATUSES } from '@/common/constants';

const ticketSchema = new Schema<Ticket>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    serviceAddress: { type: String, required: true, index: true },
    workOrderDescription: { type: String, required: true },
    timeAvailability: { type: String, required: true },
    status: { type: String, required: true, enum: TICKET_STATUSES, default: 'New', index: true },
    assignedTo: { type: String, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    invoiceNumber: { type: String, default: '' },
    partsUsed: { type: [String], default: [] },
    servicesDelivered: { type: String, default: '' },
    additionalNotes: { type: String, default: '' },
    amountBilled: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    images: [{ type: String, default: [] }],
    priority: { type: String, enum: ['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'], default: '' },
  },
  {
    collection: 'tickets',
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        return {
          id: ret._id, // Map _id to id
          ...ret,
          _id: undefined, // Remove _id
          __v: undefined, // Remove __v
        };
      },
    },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        return {
          id: ret._id, // Map _id to id
          ...ret,
          _id: undefined, // Remove _id
          __v: undefined, // Remove __v
        };
      },
    },
  }
);

ticketSchema.index({ status: 1, assignedTo: 1 });
ticketSchema.index({ createdAt: -1 });

const TicketModel = model<Ticket>('Ticket', ticketSchema);

export default TicketModel;