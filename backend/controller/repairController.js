import Repair from "../model/repairModel.js";
// @desc    Get all repairs
// @route   GET /api/repairs
// @access  Public
export const getRepairs = async (req, res) => {
  try {
    const repairs = await Repair.find().sort({ date: -1 }); // Sort by newest first
    res.status(200).json(repairs);
  } catch (error) {
    console.error("Error fetching repairs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single repair
// @route   GET /api/repairs/:id
// @access  Public
export const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({ message: "Repair not found" });
    }
    res.status(200).json(repair);
  } catch (error) {
    console.error("Error fetching repair:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create new repair
// @route   POST /api/repairs
// @access  Public
export const createRepair = async (req, res) => {
  try {
    const {
      name,
      phone,
      model,
      color,
      problem,
      caseIncluded,
      battery,
      agreedPrice,
      paid
    } = req.body;

    // Calculate remaining balance
    const remaining = (Number(agreedPrice) || 0) - (Number(paid) || 0);

    const newRepair = new Repair({
      name,
      phone,
      model,
      color,
      problem,
      caseIncluded,
      battery,
      agreedPrice: Number(agreedPrice) || 0,
      paid: Number(paid) || 0,
      remaining
    });

    const savedRepair = await newRepair.save();
    res.status(201).json({
      message: "Repair created successfully",
      repair: savedRepair
    });
  } catch (error) {
    console.error("Error creating repair:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update repair
// @route   PUT /api/repairs/:id
// @access  Public
export const updateRepair = async (req, res) => {
  try {
    const {
      name,
      phone,
      model,
      color,
      problem,
      caseIncluded,
      battery,
      agreedPrice,
      paid
    } = req.body;

    // Calculate remaining balance
    const remaining = (Number(agreedPrice) || 0) - (Number(paid) || 0);

    const updatedRepair = await Repair.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        model,
        color,
        problem,
        caseIncluded,
        battery,
        agreedPrice: Number(agreedPrice) || 0,
        paid: Number(paid) || 0,
        remaining
      },
      { new: true, runValidators: true }
    );

    if (!updatedRepair) {
      return res.status(404).json({ message: "Repair not found" });
    }

    res.status(200).json({
      message: "Repair updated successfully",
      repair: updatedRepair
    });
  } catch (error) {
    console.error("Error updating repair:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete repair
// @route   DELETE /api/repairs/:id
// @access  Public
export const deleteRepair = async (req, res) => {
  try {
    const deletedRepair = await Repair.findByIdAndDelete(req.params.id);
    
    if (!deletedRepair) {
      return res.status(404).json({ message: "Repair not found" });
    }

    res.status(200).json({
      message: "Repair deleted successfully",
      repair: deletedRepair
    });
  } catch (error) {
    console.error("Error deleting repair:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Search repairs
// @route   GET /api/repairs/search/:query
// @access  Public
export const searchRepairs = async (req, res) => {
  try {
    const query = req.params.query;
    const repairs = await Repair.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { model: { $regex: query, $options: 'i' } }
      ]
    }).sort({ date: -1 });

    res.status(200).json(repairs);
  } catch (error) {
    console.error("Error searching repairs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get repair statistics
// @route   GET /api/repairs/stats/summary
// @access  Public
export const getRepairStats = async (req, res) => {
  try {
    const totalRepairs = await Repair.countDocuments();
    const totalRevenue = await Repair.aggregate([
      { $group: { _id: null, total: { $sum: "$agreedPrice" } } }
    ]);
    const totalPaid = await Repair.aggregate([
      { $group: { _id: null, total: { $sum: "$paid" } } }
    ]);
    const pendingAmount = await Repair.aggregate([
      { $group: { _id: null, total: { $sum: "$remaining" } } }
    ]);

    // Get today's repairs
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayRepairs = await Repair.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const todayRevenue = await Repair.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: "$agreedPrice" } } }
    ]);

    res.status(200).json({
      totalRepairs,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      todayRepairs,
      todayRevenue: todayRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

