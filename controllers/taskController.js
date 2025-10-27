import Task from "../models/task.js";
import User from "../models/user.js";

export const getTasks = async (req, res) => {
  try {
    console.log('Getting tasks for user ID:', req.user.id);
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    console.log('Found tasks:', tasks.length);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error getting tasks:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate({
        path: 'userId',
        select: 'username email',
        model: 'User'
      })
      .populate({
        path: 'assignedBy',
        select: 'username email',
        model: 'User'
      })
      .sort({ createdAt: -1 });
    
    // Filter out tasks with deleted users
    const validTasks = tasks.filter(task => task.userId);
    
    res.status(200).json(validTasks);
  } catch (error) {
    console.error("Error getting all tasks:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    console.log('Creating task for user ID:', req.user.id);
    const task = new Task({
      title,
      description,
      dueDate,
      userId: req.user.id
    });

    await task.save();
    console.log('Task created:', task._id);
    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updateData,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'started', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task status updated successfully", task });
  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin functions - can manage any user's tasks
export const adminUpdateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    const task = await Task.findByIdAndUpdate(id, updateData, { new: true });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const adminDeleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const assignTask = async (req, res) => {
  try {
    const { title, description, userId, dueDate } = req.body;

    if (!title || !description || !userId) {
      return res.status(400).json({ message: "Title, description, and userId are required" });
    }

    const task = new Task({
      title,
      description,
      userId,
      assignedBy: req.user.id,
      assignmentStatus: "assigned",
      dueDate
    });

    await task.save();
    const populatedTask = await Task.findById(task._id)
      .populate('userId', 'username email')
      .populate('assignedBy', 'username email');

    res.status(201).json({ message: "Task assigned successfully", task: populatedTask });
  } catch (error) {
    console.error("Error assigning task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const respondToTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body; // "accepted" or "rejected"

    if (!response || !["accepted", "rejected"].includes(response)) {
      return res.status(400).json({ message: "Valid response (accepted/rejected) is required" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id, assignmentStatus: "assigned" },
      { assignmentStatus: response },
      { new: true }
    ).populate('userId', 'username email').populate('assignedBy', 'username email');

    if (!task) {
      return res.status(404).json({ message: "Task not found or already responded" });
    }

    res.status(200).json({ message: `Task ${response} successfully`, task });
  } catch (error) {
    console.error("Error responding to task:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.user.id, 
      assignmentStatus: { $in: ["assigned", "accepted", "rejected"] }
    })
    .populate('assignedBy', 'username email')
    .sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error getting assigned tasks:", error);
    return res.status(500).json({ message: "Server error" });
  }
};