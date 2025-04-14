// src/common/interfaces.ts

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
	inProgress: boolean;
	assignedTo?: string;
	createdAt: Date;
	updatedAt: Date;
	partsUsed?: string[];
	servicesDelivered?: string;
	additionalNotes?: string;
	amountBilled?: number;
	amountPaid?: number;
	images?: { type: string, default: [] }[];
	priority?: Priority;
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
	refreshToken?: string;
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
