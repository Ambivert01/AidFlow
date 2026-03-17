import * as donationService from "./donation.service.js";

export const donate = async (req, res, next) => {
  try {
    const donation = await donationService.createDonation(
      req.user._id,
      req.body
    );

    res.json({
      success: true,
      data: donation,
    });
  } catch (err) {
    next(err);
  }
};