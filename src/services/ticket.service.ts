import TicketModel from '@/models/schema/ticket';
import Sequence from '@/models/schema/sequence';
import { EstimateFile, Ticket } from '@/common/interfaces';
import * as moment from 'moment-timezone';
import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TICKET_STATUSES } from '@/common/constants';

@Injectable()
export class TicketService {

	private async updateCoordidates(ticketNumber: string, serviceAddress: string): Promise<void> {
		const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(serviceAddress)}&key=${process.env.GOOGLE_API_KEY}`);
		const data = await res.json();

		if (data.status !== 'OK' || data.results.length === 0) {
			return;
		}

		const location = data.results[0].geometry.location;
		await TicketModel.findOneAndUpdate({ ticketNumber }, { coordinates: { latitude: location.lat, longitude: location.lng } }, { new: true, runValidators: true });
	}

	async createTicket(data): Promise<Ticket> {
		const ticketNumber = await this.generateTicketNumber();
		const ticket = new TicketModel({ ...data, ticketNumber });
		await ticket.save();
		this.updateCoordidates(ticketNumber, data.serviceAddress);
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

	async getTicketStats(): Promise<{ total: number; new: number; open: number;[user: string]: number | { total: number; new: number; open: number } }> {
		const stats = await TicketModel.aggregate([
			{
				$facet: {
					statusStats: [
						{
							$match: {
								status: { $in: TICKET_STATUSES }
							}
						},
						{
							$group: {
								_id: '$status',
								count: { $sum: 1 },
							},
						},
					],
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
			result.total = data.total[0]?.count || 0;

			data.statusStats.forEach((stat) => {
				if (stat._id === 'New') result.new = stat.count;
				if (stat._id === 'Open') result.open = stat.count;
			});

			const userData = new Map<string, { total: number; new: number; open: number; needEstimate: number; estimateSent: number; estimateApproved: number }>();

			data.userStats.forEach((stat) => {
				const user = stat._id.user;
				const status = stat._id.status;
				const count = stat.count;

				if (!userData.has(user)) {
					userData.set(user, { total: 0, new: 0, open: 0, needEstimate: 0, estimateSent: 0, estimateApproved: 0 });
				}

				const userStats = userData.get(user)!;
				userStats.total += count;
				if (status === 'New') userStats.new += count;
				if (status === 'Open') userStats.open += count;
				if (status === 'Need Estimate') userStats.needEstimate += count;
				if (status === 'Estimate Sent') userStats.estimateSent += count;
				if (status === 'Estimate Approved') userStats.estimateApproved += count;
			});

			userData.forEach((stats, user) => {
				result[user] = stats;
			});
		}

		return result;
	}

	async getAllTickets(filters: { status?: string; user?: string }): Promise<Partial<Ticket[]>> {
		const query: any = {};
		if (filters.status) {
			query.status = filters.status;
		}
		if (filters.user) {
			query.assignedTo = filters.user;
		}

		const tickets = await TicketModel.find(query)
			.select('-images -additionalNotes -servicesDelivered -partsUsed -estimateFiles -invoiceNumber -amountBilled -amountPaid')
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

	async getEstimateFiles(id: string): Promise<EstimateFile[]> {
		const ticket = await TicketModel.findById(id).select('estimateFiles').exec();
		if (!ticket) {
			throw new HttpException('Ticket not found', HttpStatus.NO_CONTENT);
		}
		return ticket.estimateFiles || [];
	}

	async addEstimateFile(id: string, file): Promise<void> {
		const estimateFile: EstimateFile = {
			index: file.index,
			fileName: file.fileName,
			approved: 'Pending',
			data: file.data,
			contentType: 'application/pdf',
			uploadedAt: new Date(),
		}
		await TicketModel.findByIdAndUpdate(id, { $push: { estimateFiles: estimateFile } }, { new: true, runValidators: true })
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
