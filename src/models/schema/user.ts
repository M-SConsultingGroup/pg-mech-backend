import { Schema, model, Document } from 'mongoose';
import { User } from '@/common/interfaces';

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_admin: { type: Boolean, required: true },
  },
  {
    collection: 'users',
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        // Create a new object with `id` at the top
        return {
          id: ret._id, // Map _id to id
          ...ret, // Spread the rest of the properties
          _id: undefined, // Remove _id
          __v: undefined, // Remove __v
        };
      },
    },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Create a new object with `id` at the top
        return {
          id: ret._id, // Map _id to id
          ...ret, // Spread the rest of the properties
          _id: undefined, // Remove _id
          __v: undefined, // Remove __v
        };
      },
    },
  }
);

const UserModel = model<User>('User', userSchema);

export default UserModel;