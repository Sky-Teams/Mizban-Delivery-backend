import {
  acceptAnOfferWithTransaction,
  rejectAnOfferWithTransaction,
} from '../../services/v1/offer.service.js';
import { unauthorized } from '#shared/errors/error.js';
import { OfferService } from '#shared/utils/offerService.js';
import { DbJobService } from '#shared/utils/dbJob.service.js';

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
  res.json({ success: true, offer });
};
