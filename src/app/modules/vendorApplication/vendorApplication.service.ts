import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { USER_ROLES } from '../../../enums/user';
import { User } from '../user/user.model';
import { Store } from '../store/store.model';
import { StoreService } from '../store/store.service';
import { IStore } from '../store/store.interface';
import { IVendorApplication } from './vendorApplication.interface';
import { VendorApplication } from './vendorApplication.model';

const createVendorApplicationToDB = async (
  payload: Pick<IVendorApplication, 'storeName' | 'businessField' | 'email'>
) => {
  return VendorApplication.create(payload);
};

const getVendorApplicationsFromDB = async (query: Record<string, unknown>) => {
  const applicationQuery = new QueryBuilder(VendorApplication.find().lean(), query)
    .search(['storeName', 'email', 'businessField'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    applicationQuery.modelQuery,
    applicationQuery.countTotal(),
  ]);

  return { data, meta };
};

const getPendingApplication = async (id: string) => {
  const application = await VendorApplication.findById(id);
  if (!application) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Vendor application not found');
  }
  if (application.status !== 'PENDING') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This application was already ${application.status.toLowerCase()}`
    );
  }
  return application;
};

// Approving turns the application into a live VENDOR account (found or
// created by phone) plus the Store that account owns — the phone number
// becomes the vendor's login identity for the normal OTP endpoints.
type ApprovePayload = {
  contactName: string;
  phone: string;
  countryCode: string;
} & Omit<Parameters<typeof StoreService.createStoreToDB>[0], 'owner' | 'name'>;

const approveVendorApplicationToDB = async (
  applicationId: string,
  adminId: string,
  payload: ApprovePayload
) => {
  const application = await getPendingApplication(applicationId);
  const { contactName, phone, countryCode, ...storePayload } = payload;

  let vendorUser = await User.findOne({ phone });
  if (vendorUser && vendorUser.role !== USER_ROLES.VENDOR) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This phone number is already registered under a different role'
    );
  }

  if (!vendorUser) {
    vendorUser = await User.create({
      name: contactName,
      phone,
      countryCode,
      email: application.email,
      role: USER_ROLES.VENDOR,
      verified: true,
    });
  }

  const existingStore = await Store.findOne({ owner: vendorUser._id });
  if (existingStore) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This vendor already has a store'
    );
  }

  const store = await StoreService.createStoreToDB({
    ...(storePayload as Omit<IStore, 'owner' | 'name'>),
    owner: vendorUser._id,
    name: application.storeName,
  });

  application.status = 'APPROVED';
  application.reviewedBy = new Types.ObjectId(adminId);
  await application.save();

  return { application, store, vendorUser };
};

const rejectVendorApplicationToDB = async (
  applicationId: string,
  adminId: string,
  reviewNote?: string
) => {
  const application = await getPendingApplication(applicationId);

  application.status = 'REJECTED';
  application.reviewedBy = new Types.ObjectId(adminId);
  application.reviewNote = reviewNote;
  await application.save();

  return application;
};

export const VendorApplicationService = {
  createVendorApplicationToDB,
  getVendorApplicationsFromDB,
  approveVendorApplicationToDB,
  rejectVendorApplicationToDB,
};
