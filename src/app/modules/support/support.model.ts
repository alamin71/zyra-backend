import { model, Schema } from 'mongoose';
import {
  HelpTopicModel,
  IHelpTopic,
  ISupportMessage,
  SupportMessageModel,
} from './support.interface';

const helpTopicSchema = new Schema<IHelpTopic, HelpTopicModel>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

helpTopicSchema.index({ order: 1 });

export const HelpTopic = model<IHelpTopic, HelpTopicModel>(
  'HelpTopic',
  helpTopicSchema
);

const supportMessageSchema = new Schema<ISupportMessage, SupportMessageModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
  },
  { timestamps: true }
);

supportMessageSchema.index({ user: 1, createdAt: -1 });

export const SupportMessage = model<ISupportMessage, SupportMessageModel>(
  'SupportMessage',
  supportMessageSchema
);
