import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { AddressService } from './address.service';

const createAddress = catchAsync(async (req, res) => {
  const result = await AddressService.createAddressToDB(
    req.user.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Address added successfully',
    data: result,
  });
});

const getAddresses = catchAsync(async (req, res) => {
  const result = await AddressService.getAddressesFromDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Addresses retrieved successfully',
    data: result,
  });
});

const updateAddress = catchAsync(async (req, res) => {
  const result = await AddressService.updateAddressToDB(
    req.user.id,
    resolveParam(req.params.id),
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Address updated successfully',
    data: result,
  });
});

const deleteAddress = catchAsync(async (req, res) => {
  await AddressService.deleteAddressFromDB(
    req.user.id,
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Address deleted successfully',
  });
});

export const AddressController = {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};
