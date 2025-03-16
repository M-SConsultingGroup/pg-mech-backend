// src/services/ticket.service.ts
import TicketModel from '@/models/schema/ticket';
import Sequence from '@/models/schema/sequence';
import { Ticket as TicketInterface } from '@/common/interfaces';
import moment from 'moment-timezone';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TicketService {
	async createTicket(data): Promise<TicketInterface> {
		const ticketNumber = await this.generateTicketNumber();
		const ticket = new TicketModel({ ...data, ticketNumber });
		await ticket.save();
		return ticket.toObject() as TicketInterface;
	}

	async updateTicket(id, data): Promise<TicketInterface | null> {
		data.updatedAt = new Date();
		if (data.assignedTo === 'Unassigned') {
			data.status = 'New';
			data.priority = '';
		}
		if (data.status !== 'Open') {
			data.priority = '';
		}
		const ticket = await TicketModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
		return ticket ? (ticket.toObject() as TicketInterface) : null;
	}

	async getTicketById(id): Promise<TicketInterface | null> {
		const ticket = await TicketModel.findById(id);
		return ticket ? (ticket.toObject() as TicketInterface) : null;
	}

	async getAllTickets(): Promise<TicketInterface[]> {
		const tickets = await TicketModel.find();
		return tickets.map(ticket => ticket.toObject() as TicketInterface);
	}

	async deleteTicket(id): Promise<TicketInterface | null> {
		const ticket = await TicketModel.findByIdAndDelete(id);
		return ticket ? (ticket.toObject() as TicketInterface) : null;
	}

	async conditionalDeleteTicket(id): Promise<void> {
		const ticket = await this.getTicketById(id);
		if (ticket && ticket.assignedTo && ticket.assignedTo !== 'Unassigned') {
			throw new Error('Cannot delete assigned ticket');
		}
		if (ticket) {
			await TicketModel.deleteOne({ _id: id });
		}
	}

	async rescheduleTicket(id, timeAvailability): Promise<TicketInterface> {
		const ticket = await this.getTicketById(id);
		if (!ticket) {
			throw new Error('Ticket not found');
		}
		ticket.timeAvailability = timeAvailability;
		await TicketModel.findByIdAndUpdate(id, ticket, { new: true });
		return ticket;
	}

	private async generateTicketNumber(): Promise<string> {
		const date = moment().tz('America/Chicago');
		const currentDate = date.format('YYYY-MM-DD');
		let sequenceDoc = await Sequence.findOne({ date: currentDate });
		if (!sequenceDoc) {
			sequenceDoc = new Sequence({ date: currentDate, sequence: 0 });
		}
		sequenceDoc.sequence += 1;
		await sequenceDoc.save();
		const year = date.year();
		const month = date.format('MM');
		const day = date.format('DD');
		return `${year}${month}${day}-${sequenceDoc.sequence.toString().padStart(4, '0')}`;
	}
}