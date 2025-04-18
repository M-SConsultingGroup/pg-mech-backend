import { Schema, model, Document } from 'mongoose';
import { User } from '@/common/interfaces';

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true },
    token: { type: String, required: false },
  },
  {
    collection: 'users',
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        return {
          ...ret,
          _id: undefined, // Remove _id
          __v: undefined, // Remove __v
        };
      },
    },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        return {
          ...ret,
          _id: undefined, // Remove _id
          __v: undefined, // Remove __v
        };
      },
    },
  }
);

const UserModel = model<User>('User', userSchema);

export default UserModel;