import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { VendorApplicationService } from './vendorApplication.service';

const createVendorApplication = catchAsync(async (req, res) => {
  const result = await VendorApplicationService.createVendorApplicationToDB(
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message:
      "Application submitted. We'll review it and get back to you by email.",
    data: result,
  });
});

const getVendorApplications = catchAsync(async (req, res) => {
  const { data, meta } = await VendorApplicationService.getVendorApplicationsFromDB(
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Vendor applications retrieved successfully',
    data,
    meta,
  });
});

const approveVendorApplication = catchAsync(async (req, res) => {
  const result = await VendorApplicationService.approveVendorApplicationToDB(
    resolveParam(req.params.id),
    req.user.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Vendor application approved. Store and vendor account created.',
    data: result,
  });
});

const rejectVendorApplication = catchAsync(async (req, res) => {
  const result = await VendorApplicationService.rejectVendorApplicationToDB(
    resolveParam(req.params.id),
    req.user.id,
    req.body.reviewNote
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Vendor application rejected',
    data: result,
  });
});

export const VendorApplicationController = {
  createVendorApplication,
  getVendorApplications,
  approveVendorApplication,
  rejectVendorApplication,
};
