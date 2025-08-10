import { Binary } from 'bson';

export interface Ticket {
	id: string;
	ticketNumber: string;
	name: string;
	email: string;
	phoneNumber: string;
	serviceAddress: string;
	workOrderDescription: string;
	timeAvailability: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	assignedTo?: string;
	poNumber?: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	invoiceNumber?: string;
	partsUsed?: string[];
	servicesDelivered?: string;
	additionalNotes?: string;
	amountBilled?: number;
	amountPaid?: number;
	images?: { type: string, default: [] }[];
	priority?: Priority;
	estimateFiles?: EstimateFile[];
}

export interface EstimateFile {
	index: number;
	fileName: string;
	data: Buffer;
	approved?: 'Approved' | 'Denied' | 'Pending';
	contentType: string;
	uploadedAt: Date;
}

export interface Parts {
	category: string;
	parts: string[];
}

export interface User {
	id: string,
	username: string;
	password?: string;
	isAdmin: boolean;
	token?: string;
}

export interface TimeRange {
	startTime: Date;
	endTime?: Date;
}

export interface TimeEntry {
	user: string;
	ticket: string;
	timeRanges: TimeRange[];
	week: number;
}

export interface UserHours {
	[user: string]: {
		total: number;
		weekly: {
			[week: number]: number;
		};
	};
}

export type Priority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest' | '';

export interface LineItem {
	name: string;
	quantity: number;
	price: number;
	notes: string;
}