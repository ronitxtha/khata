import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  date: { type: Date, required: true },
  checkInTime: { type: Date },
  lastLogoutClick: { type: Date },
  checkOutTime: { type: Date },
  status: { type: String, enum: ["present", "absent"], default: "present" },
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model("Attendance", attendanceSchema);
