import { Schema, model } from 'mongoose';
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
    coordinates: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    invoiceNumber: { type: String, default: '' },
    partsUsed: { type: [String], default: [] },
    servicesDelivered: { type: String, default: '' },
    additionalNotes: { type: String, default: '' },
    amountBilled: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    images: [{ type: String, default: [] }],
    priority: { type: String, enum: ['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'], default: '' },
    estimateFiles: [
      {
        index: { type: Number, required: true },
        fileName: { type: String, required: true },
        approved: { type: String, required: true },
        data: { type: Buffer, required: true },
        contentType: { type: String, default: 'application/pdf' },
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    collection: 'tickets',
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        return {
          id: ret._id,
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
          id: ret._id,
          ...ret,
          _id: undefined, // Remove _id
          __v: undefined, // Remove __v
        };
      },
    },
  }
);

ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });

const TicketModel = model<Ticket>('Ticket', ticketSchema);

export default TicketModel;