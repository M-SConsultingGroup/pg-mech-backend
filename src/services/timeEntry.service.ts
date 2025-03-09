// src/services/timeEntry.service.ts
import TimeEntryModel from '@/models/timeEntry';
import { TimeEntry } from '@/common/interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeEntryService {
  async createTimeEntry(data): Promise<TimeEntry> {
    const timeEntry = new TimeEntryModel(data);
    await timeEntry.save();
    return timeEntry.toObject() as TimeEntry;
  }

  async updateTimeEntry(userId: string, ticketId: string, endTime: Date): Promise<TimeEntry | null> {
    const timeEntry = await TimeEntryModel.findOne({ user: userId, ticket: ticketId });
    if (timeEntry) {
      const openRange = timeEntry.timeRanges.find(range => !range.endTime);
      if (openRange) {
        openRange.endTime = endTime;
        await timeEntry.save();
      }
    }
    return timeEntry ? (timeEntry.toObject() as TimeEntry) : null;
  }

  async getTimeEntries(filter = {}): Promise<TimeEntry[]> {
    const timeEntries = await TimeEntryModel.find(filter).populate('ticket');
    return timeEntries.map(entry => entry.toObject() as TimeEntry);
  }
}