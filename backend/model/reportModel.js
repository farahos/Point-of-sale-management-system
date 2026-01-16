import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: ['sales', 'products', 'repairs', 'combined']
  },
  reportName: {
    type: String,
    required: true
  },
  filters: {
    startDate: Date,
    endDate: Date,
    month: Number,
    year: Number,
    category: String,
    productId: String,
    customerId: String,
    status: String,
    // Additional filters
    dateRange: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom']
    }
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generationDate: {
    type: Date,
    default: Date.now
  },
  format: {
    type: String,
    enum: ['json', 'csv', 'pdf', 'excel'],
    default: 'json'
  }
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);
export default Report;