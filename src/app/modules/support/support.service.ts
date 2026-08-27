import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { HelpTopic, SupportMessage } from './support.model';
import {
  IHelpTopic,
  ISupportMessage,
  SupportMessageStatus,
} from './support.interface';

// ---- Help Topics ----

const createHelpTopicToDB = async (payload: IHelpTopic) => {
  return HelpTopic.create(payload);
};

const getHelpTopicsFromDB = async (query: Record<string, unknown>) => {
  const topicQuery = new QueryBuilder(
    HelpTopic.find({ isActive: true }).lean(),
    { sort: 'order', ...query }
  )
    .search(['title'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    topicQuery.modelQuery,
    topicQuery.countTotal(),
  ]);

  return { data, meta };
};

const getHelpTopicFromDB = async (id: string) => {
  const topic = await HelpTopic.findOne({ _id: id, isActive: true }).lean();
  if (!topic) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Help topic not found');
  }
  return topic;
};

const updateHelpTopicToDB = async (
  id: string,
  payload: Partial<IHelpTopic>
) => {
  const topic = await HelpTopic.findByIdAndUpdate(id, payload, { new: true });
  if (!topic) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Help topic not found');
  }
  return topic;
};

const deleteHelpTopicFromDB = async (id: string) => {
  const topic = await HelpTopic.findByIdAndDelete(id);
  if (!topic) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Help topic not found');
  }
  return topic;
};

// ---- Support (Contact Us) Messages ----

const createSupportMessageToDB = async (
  userId: string,
  payload: Pick<ISupportMessage, 'message'>
) => {
  return SupportMessage.create({ ...payload, user: userId });
};

const getSupportMessagesFromDB = async (query: Record<string, unknown>) => {
  const messageQuery = new QueryBuilder(
    SupportMessage.find().populate('user', 'name phone email').lean(),
    { sort: '-createdAt', ...query }
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    messageQuery.modelQuery,
    messageQuery.countTotal(),
  ]);

  return { data, meta };
};

const updateSupportMessageStatusToDB = async (
  id: string,
  status: SupportMessageStatus
) => {
  const message = await SupportMessage.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (!message) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Support message not found');
  }
  return message;
};

export const SupportService = {
  createHelpTopicToDB,
  getHelpTopicsFromDB,
  getHelpTopicFromDB,
  updateHelpTopicToDB,
  deleteHelpTopicFromDB,
  createSupportMessageToDB,
  getSupportMessagesFromDB,
  updateSupportMessageStatusToDB,
};
