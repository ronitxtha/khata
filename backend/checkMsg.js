import mongoose from 'mongoose';
import 'dotenv/config';
import { Shop } from './models/shopModel.js';
import connectDB from './database/db.js';

async function testFetch() {
  await connectDB();
  const shop = await Shop.findById("69555624f9e29e2982961c1e");
  console.log("Shop exists?", shop !== null);
  console.log(shop);
  process.exit(0);
}
testFetch();
