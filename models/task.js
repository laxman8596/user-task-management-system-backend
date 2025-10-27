import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "started", "completed"], 
    default: "pending" 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  assignmentStatus: {
    type: String,
    enum: ["self-created", "assigned", "accepted", "rejected"],
    default: "self-created"
  },
  dueDate: { 
    type: Date 
  }
}, { timestamps: true });

const Task = mongoose.model("Task", taskSchema);

export default Task;