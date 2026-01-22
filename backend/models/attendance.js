import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  date: { type: Date, required: true },
  checkInTime: { type: Date },             // auto on login
  lastLogoutClick: { type: Date },         // store last logout clicked
  checkOutTime: { type: Date },            // official check-out, set at end of day
  status: { type: String, enum: ["present", "absent"], default: "present" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Attendance", attendanceSchema);
