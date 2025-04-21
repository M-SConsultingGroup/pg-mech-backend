// src/services/ticket.service.ts
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
		[status: string]: number | { [status: string]: number };
	}> {
		const stats = await TicketModel.aggregate([
			{
				$facet: {
					// Get counts by status for the overall totals
					statusStats: [
						{
							$group: {
								_id: '$status',
								count: { $sum: 1 },
							},
						},
					],
					// Get counts by both user and status for the detailed breakdown
					userStatusStats: [
						{
							$match: {
								assignedTo: { $exists: true, $ne: '' } // Filter out unassigned tickets
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
					// Get total count of all tickets
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
			[key: string]: number | { [status: string]: number };
		} = { total: 0 };

		if (stats.length > 0) {
			const [data] = stats;

			// Set total count
			if (data.total.length > 0) {
				result.total = data.total[0].count;
			}

			// Add status counts
			data.statusStats.forEach((stat) => {
				result[stat._id] = stat.count;
			});

			// Process user stats with status breakdown
			const userStats: { [user: string]: { [status: string]: number } } = {};

			data.userStatusStats.forEach((stat) => {
				const user = stat._id.user;
				const status = !stat._id.status || stat._id.status === '' ? 'NoStatus' : stat._id.status;

				if (!userStats[user]) {
					userStats[user] = { total: 0 };
				}

				userStats[user][status] = (userStats[user][status] || 0) + stat.count;
				userStats[user].total += stat.count;
			});

			// Add user stats to the result
			for (const [user, stats] of Object.entries(userStats)) {
				result[user] = stats;
			}
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
		const tickets = await TicketModel.find(query);
		return tickets.map(ticket => ticket.toObject() as Ticket);
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