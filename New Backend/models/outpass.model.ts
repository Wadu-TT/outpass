import mongoose from 'mongoose';

export interface IOutpass {
  student: mongoose.Types.ObjectId;
  startDateTime: Date;
  endDateTime: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'used';
  qrCode: string;
  tokenHash: string;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const outpassSchema = new mongoose.Schema<IOutpass>(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    startDateTime: {
      type: Date,
      required: [true, 'Start date and time is required'],
    },
    endDateTime: {
      type: Date,
      required: [true, 'End date and time is required'],
      validate: {
        validator: function(this: IOutpass, value: Date) {
          return value > this.startDateTime;
        },
        message: 'End date must be after start date',
      },
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'used'],
      default: 'pending',
    },
    qrCode: {
      type: String,
      required: false,
    },
    tokenHash: {
      type: String,
      required: false,
    },
    usedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
outpassSchema.index({ student: 1, status: 1 });
outpassSchema.index({ tokenHash: 1 });
outpassSchema.index({ startDateTime: 1, endDateTime: 1 });

const Outpass = mongoose.model<IOutpass>('Outpass', outpassSchema);

export default Outpass;