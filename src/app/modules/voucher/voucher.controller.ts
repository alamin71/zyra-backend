import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { VoucherService } from './voucher.service';

const createVoucher = catchAsync(async (req, res) => {
  const result = await VoucherService.createVoucherToDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Voucher created successfully',
    data: result,
  });
});

const getVouchers = catchAsync(async (req, res) => {
  const { data, meta } = await VoucherService.getVouchersFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Vouchers retrieved successfully',
    data,
    meta,
  });
});

const getMyVouchers = catchAsync(async (req, res) => {
  const result = await VoucherService.getMyVouchersFromDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your vouchers retrieved successfully',
    data: result,
  });
});

const applyVoucher = catchAsync(async (req, res) => {
  const result = await VoucherService.previewVoucherForCartToDB(
    req.user.id,
    req.body.code
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Voucher applied',
    data: result,
  });
});

const deleteVoucher = catchAsync(async (req, res) => {
  await VoucherService.deleteVoucherFromDB(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Voucher deleted successfully',
  });
});

export const VoucherController = {
  createVoucher,
  getVouchers,
  getMyVouchers,
  applyVoucher,
  deleteVoucher,
};
