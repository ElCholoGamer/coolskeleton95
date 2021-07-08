import mongoose from 'mongoose';

async function db() {
	if (mongoose.connection.readyState >= 1) return;

	return await mongoose.connect(process.env.MONGO_URI!, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
}

export default db;
