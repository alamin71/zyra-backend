import { Model, Types } from 'mongoose';

export type IHelpTopic = {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
};

export type HelpTopicModel = Model<IHelpTopic>;

export type SupportMessageStatus = 'open' | 'resolved';

export type ISupportMessage = {
  user: Types.ObjectId;
  message: string;
  status: SupportMessageStatus;
};

export type SupportMessageModel = Model<ISupportMessage>;
