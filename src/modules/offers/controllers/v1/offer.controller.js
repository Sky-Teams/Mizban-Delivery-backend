import {
  acceptAnOfferWithTransaction,
  getOfferByIdForDriver,
  rejectAnOfferWithTransaction,
  getAllOffersForDriver,
} from '../../services/v1/offer.service.js';
import { notFound, unauthorized } from '#shared/errors/error.js';
import { OfferService } from '#shared/utils/offerService.js';
import { DbJobService } from '#shared/utils/dbJob.service.js';
import { fetchDriverByUserId } from '#modules/drivers/index.js';

export const acceptOffer = async (req, res) => {
  if (!req.user) throw unauthorized();
  const offer = await acceptAnOfferWithTransaction(req.params.id, req.user._id);
  await DbJobService.scheduleCalculateAcceptanceRate(req.user._id);
  res.status(200).json({ success: true, data: offer });
};

export const rejectOffer = async (req, res) => {
  if (!req.user) throw unauthorized();

  const offer = await rejectAnOfferWithTransaction(req.params.id, req.user._id);
  await OfferService.sendOfferToDriver(offer.order.toString());
  await DbJobService.scheduleCalculateAcceptanceRate(req.user._id);
  res.status(200).json({ success: true, data: offer });
};

export const getOfferById = async (req, res) => {
  if (!req.user) throw unauthorized();

  const driver = await fetchDriverByUserId(req.user._id);
  if (!driver) throw notFound('Driver');

  const offer = await getOfferByIdForDriver(driver._id, req.params.id);
  res.status(200).json({ success: true, data: offer });
};

export const getAllOffers = async (req, res) => {
  if (!req.user) throw unauthorized();

  const page = +req.query.page || 1;
  const limit = +req.query.limit || 8;
  const status = req.query.status;

  const driver = await fetchDriverByUserId(req.user._id);
  if (!driver) throw notFound('Driver');

  const result = await getAllOffersForDriver(driver.id, page, limit, status);

  res.status(200).json({
    success: true,
    data: result.paginatedOffers,
    totalOffers: result.totalOffers,
    totalPages: result.totalPages,
  });
};
