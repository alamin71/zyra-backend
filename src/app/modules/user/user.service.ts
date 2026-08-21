import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from './user.interface';
import { User } from './user.model';
import AppError from '../../../errors/AppError';

// get user profile
const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

// update user profile
const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (
    payload.image &&
    isExistUser.image &&
    !isExistUser.image.startsWith('http://') &&
    !isExistUser.image.startsWith('https://')
  ) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

// soft delete — the requester's identity is already proven by a valid access
// token, so (unlike the old email/password flow) there is no password to
// re-confirm with for CUSTOMER/VENDOR accounts.
const deleteUser = async (id: string) => {
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  await User.findByIdAndUpdate(id, {
    $set: { isDeleted: true },
  });

  return true;
};

export const UserService = {
  getUserProfileFromDB,
  updateProfileToDB,
  deleteUser,
};
