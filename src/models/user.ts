import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
	_id: string;
	gold: number;
	hp: number;
	lv: number;
	exp: number;
	items: Map<string, number>;
}

const UserSchema = new Schema({
	_id: String,
	gold: { type: Number, required: true, min: 0, default: 0 },
	hp: { type: Number, required: true, min: 0, default: 20 },
	lv: { type: Number, required: true, min: 1, max: 20, default: 1 },
	exp: { type: Number, required: true, min: 0, default: 0 },
	items: { type: Map, of: Number, required: true, default: {} },
});

const User = model<IUser>('User', UserSchema);

export default User;
