import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Address } from './address.model';
import { IAddress } from './address.interface';

const createAddressToDB = async (
  userId: string,
  payload: Omit<IAddress, 'user' | 'isDefault'> & { isDefault?: boolean }
) => {
  const existingCount = await Address.countDocuments({ user: userId });
  const isDefault = payload.isDefault ?? existingCount === 0;

  if (isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  return Address.create({ ...payload, user: userId, isDefault });
};

const getAddressesFromDB = async (userId: string) => {
  return Address.find({ user: userId }).sort('-isDefault -createdAt').lean();
};

const getOwnedAddress = async (userId: string, addressId: string) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Address not found');
  }
  return address;
};

const updateAddressToDB = async (
  userId: string,
  addressId: string,
  payload: Partial<IAddress>
) => {
  await getOwnedAddress(userId, addressId);

  if (payload.isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  return Address.findByIdAndUpdate(addressId, payload, { new: true });
};

const deleteAddressFromDB = async (userId: string, addressId: string) => {
  const address = await getOwnedAddress(userId, addressId);
  await address.deleteOne();

  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: userId }).sort(
      '-createdAt'
    );
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return true;
};

export const AddressService = {
  createAddressToDB,
  getAddressesFromDB,
  updateAddressToDB,
  deleteAddressFromDB,
};
