import { Schema, model, Document } from 'mongoose';
import { TimeEntry } from '@/common/interfaces';

const timeEntrySchema = new Schema<TimeEntry>({
  user: { type: String, required: true },
  ticket: { type: String, required: true },
  timeRanges: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date },
  }],
  week: { type: Number, required: true },
}, { collection: 'time_entry' });

const TimeEntryModel = model<TimeEntry>('TimeEntry', timeEntrySchema);

export default TimeEntryModel;