const mongoose = require('mongoose');
const Message = require('../src/models/MessageModel');
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log('Connected to DB');

    // Map common lowercase types to uppercase
    const mapping = {
      text: 'TEXT',
      product: 'PRODUCT',
      image: 'IMAGE',
      file: 'FILE',
      system: 'SYSTEM',
    };

    let total = 0;
    for (const [oldType, newType] of Object.entries(mapping)) {
      const res = await Message.updateMany({ type: oldType }, { $set: { type: newType } });
      console.log(`Updated ${res.modifiedCount} messages: ${oldType} -> ${newType}`);
      total += res.modifiedCount || 0;
    }

    console.log('Migration done, total updated:', total);
    process.exit(0);
  } catch (e) {
    console.error('Migration failed', e);
    process.exit(1);
  }
};

run();