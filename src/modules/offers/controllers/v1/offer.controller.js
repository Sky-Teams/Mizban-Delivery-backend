import {
  acceptAnOfferWithTransaction,
  rejectAnOfferWithTransaction,
} from '../../services/v1/offer.service.js';
import { unauthorized } from '#shared/errors/error.js';
import { OfferService } from '#shared/utils/offerService.js';

export const acceptOffer = async (req, res) => {
  if (!req.user) throw unauthorized();
  const offer = await acceptAnOfferWithTransaction(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: offer });
};

export const rejectOffer = async (req, res) => {
  if (!req.user) throw unauthorized();

  const offer = await rejectAnOfferWithTransaction(req.params.id, req.user._id);
  // sent offer to next driver, we can not move and use below logic in rejectAnOfferWithTransaction, because sendOfferToDriver should not be tight with
  // session and transaction.
  await OfferService.sendOfferToDriver(offer.order.toString());
  res.json({ success: true, offer });
};
