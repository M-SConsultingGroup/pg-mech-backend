import { Schema, model, Document } from 'mongoose';
import { Ticket } from '@/common/interfaces';
import { TICKET_STATUSES } from '@/common/constants';

interface ITicket extends Omit<Ticket, '_id'>, Document { }

const ticketSchema = new Schema<ITicket>({
  ticketNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  serviceAddress: { type: String, required: true },
  workOrderDescription: { type: String, required: true },
  timeAvailability: { type: String, required: true },
  status: { type: String, required: true, enum: TICKET_STATUSES, default: 'New' },
  inProgress: { type: Boolean, required: true, default: false },
  assignedTo: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  partsUsed: { type: [String], default: [] },
  servicesDelivered: { type: String, default: '' },
  additionalNotes: { type: String, default: '' },
  amountBilled: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  images: [{ type: String, default: [] }],
  priority: { type: String, enum: ['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'], default: '' },
}, { collection: 'tickets' });

const TicketModel = model<ITicket>('Ticket', ticketSchema);

export default TicketModel;