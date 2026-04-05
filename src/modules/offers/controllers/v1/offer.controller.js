import { acceptAnOffer, rejectAnOffer } from '../../services/v1/offer.service.js';
import { unauthorized } from '#shared/errors/error.js';

export const acceptOffer = async (req, res) => {
  if (!req.user) throw unauthorized();
  console.log(req.user);

  const offer = await acceptAnOffer(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: offer });
};

export const rejectOffer = async (req, res) => {
  if (!req.user) throw unauthorized();
  const offer = await rejectAnOffer(req.params.id, req.user._id);
  res.json({ success: true, offer });
};
