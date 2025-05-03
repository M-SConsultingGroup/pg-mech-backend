import TicketModel from '@/models/schema/ticket';
import Sequence from '@/models/schema/sequence';
import { Ticket } from '@/common/interfaces';
import * as moment from 'moment-timezone';
import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class TicketService {
	async createTicket(data): Promise<Ticket> {
		const ticketNumber = await this.generateTicketNumber();
		const ticket = new TicketModel({ ...data, ticketNumber });
		await ticket.save();
		return ticket.toObject() as Ticket;
	}

	async updateTicket(id, data): Promise<Ticket | null> {
		data.updatedAt = new Date();
		if (data.assignedTo === 'Unassigned') {
			data.status = 'New';
			data.priority = '';
		}
		if (data.status !== 'Open') {
			data.priority = '';
		}
		const ticket = await TicketModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
		return ticket ? (ticket.toObject() as Ticket) : null;
	}

	async getTicketById(id): Promise<Ticket | null> {
		const ticket = await TicketModel.findById(id);
		return ticket ? (ticket.toObject() as Ticket) : null;
	}

	async getTicketStats(): Promise<{
		total: number;
		new: number;
		open: number;
		[user: string]: number | { total: number; new: number; open: number };
	}> {
		const stats = await TicketModel.aggregate([
			{
				$facet: {
					// Get overall new and open counts
					statusStats: [
						{
							$match: {
								status: { $in: ['New', 'Open'] }
							}
						},
						{
							$group: {
								_id: '$status',
								count: { $sum: 1 },
							},
						},
					],
					// Get only assigned users' stats
					userStats: [
						{
							$match: {
								assignedTo: { $exists: true, $nin: [null, '', 'Unassigned'] }
							}
						},
						{
							$group: {
								_id: {
									user: '$assignedTo',
									status: '$status'
								},
								count: { $sum: 1 },
							},
						},
					],
					// Get total count (including unassigned)
					total: [
						{
							$group: {
								_id: null,
								count: { $sum: 1 },
							},
						},
					],
				},
			},
		]);

		const result: {
			total: number;
			new: number;
			open: number;
			[key: string]: number | { total: number; new: number; open: number };
		} = { total: 0, new: 0, open: 0 };

		if (stats.length > 0) {
			const [data] = stats;

			// Set total count
			result.total = data.total[0]?.count || 0;

			// Set status counts
			data.statusStats.forEach((stat) => {
				if (stat._id === 'New') result.new = stat.count;
				if (stat._id === 'Open') result.open = stat.count;
			});

			// Process user stats
			const userData = new Map<string, { total: number; new: number; open: number }>();

			data.userStats.forEach((stat) => {
				const user = stat._id.user;
				const status = stat._id.status;
				const count = stat.count;

				if (!userData.has(user)) {
					userData.set(user, { total: 0, new: 0, open: 0 });
				}

				const userStats = userData.get(user)!;
				userStats.total += count;
				if (status === 'New') userStats.new += count;
				if (status === 'Open') userStats.open += count;
			});

			// Add user stats to result
			userData.forEach((stats, user) => {
				result[user] = stats;
			});
		}

		return result;
	}

	async getAllTickets(filters: { status?: string; user?: string }): Promise<Ticket[]> {
		const query: any = {};
		if (filters.status) {
			query.status = filters.status;
		}
		if (filters.user) {
			query.assignedTo = filters.user;
		}

		// Exclude large fields and use lean() for better performance
		const tickets = await TicketModel.find(query)
			.select('-images -additionalNotes -servicesDelivered -partsUsed')
			.sort({ createdAt: -1 })
			.lean()
			.exec();

		return tickets.map(ticket => ({
			id: ticket?._id.toString(),
			...ticket,
			_id: undefined,
			__v: undefined
		})) as Ticket[];
	}

	async deleteTicket(id: string, isAdmin?: boolean): Promise<Ticket | null> {
		let ticket = await this.getTicketById(id);
		if (!isAdmin) {
			if (ticket.assignedTo && ticket.assignedTo !== 'Unassigned') {
				throw new BadRequestException('Cannot delete an assigned ticket');
			}
			if (ticket.status === 'Open') {
				throw new BadRequestException('Cannot delete a ticket in Open status');
			}
		}
		await TicketModel.findByIdAndDelete(id);
		return ticket;
	}

	async rescheduleTicket(id, timeAvailability): Promise<Ticket> {
		const ticket = await this.getTicketById(id);
		if (!ticket) {
			throw new HttpException('Ticket not found', HttpStatus.NO_CONTENT);
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