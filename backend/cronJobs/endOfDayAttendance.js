import cron from "node-cron";
import Attendance from "../models/attendance.js"; // correct relative path

// Run every day at 11:59 PM
cron.schedule("59 23 * * *", async () => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const records = await Attendance.find({ date: today, checkOutTime: null });

    for (const record of records) {
      if (record.lastLogoutClick) {
        record.checkOutTime = record.lastLogoutClick;
      } else {
        record.checkOutTime = new Date(today.setHours(23,59,0,0));
      }
      await record.save();
    }

    console.log(`End-of-day check-out recorded for ${records.length} staff`);
  } catch (err) {
    console.error("Error in end-of-day check-out:", err);
  }
});
