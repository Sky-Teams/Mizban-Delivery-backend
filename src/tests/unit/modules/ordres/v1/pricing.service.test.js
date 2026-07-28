import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateDeliveryPrice } from '#modules/orders/services/v1/pricing.service.js';
import { calculateDistanceMeters } from '#shared/utils/distance.helper.js';


vi.mock('#shared/utils/distance.helper.js', () => ({
  calculateDistanceMeters: vi.fn(),
}));


describe('calculateDeliveryPrice', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('should use frontend delivery price when provided', () => {

    const orderData = {
      deliveryPrice: {
        total: 100,
      },
      pickupLocation: {
        coordinates: [0, 0],
      },
      dropoffLocation: {
        coordinates: [1, 1],
      },
    };


    const result = calculateDeliveryPrice(orderData);


    expect(calculateDistanceMeters).not.toHaveBeenCalled();


    expect(result).toEqual({
      baseFee: 50,
      distanceKm: 0,
      distanceFee: 0,
      total: 150,
    });

  });



  it('should calculate delivery price based on distance when frontend price is not provided', () => {

    calculateDistanceMeters.mockReturnValue(2500);


    const orderData = {
      pickupLocation: {
        coordinates: [0, 0],
      },
      dropoffLocation: {
        coordinates: [1, 1],
      },
    };


    const result = calculateDeliveryPrice(orderData);


    expect(calculateDistanceMeters)
      .toHaveBeenCalledWith(
        [0, 0],
        [1, 1]
      );


    expect(result).toEqual({
      baseFee: 50,
      distanceKm: 2.5,
      distanceFee: 30,
      total: 80,
    });

  });



  it('should round distanceKm to two decimal places', () => {

    calculateDistanceMeters.mockReturnValue(12345);


    const orderData = {
      pickupLocation: {
        coordinates: [0, 0],
      },
      dropoffLocation: {
        coordinates: [1, 1],
      },
    };


    const result = calculateDeliveryPrice(orderData);


    expect(result.distanceKm).toBe(12.35);

  });



  it('should charge minimum one kilometer fee for distances below one kilometer', () => {

    calculateDistanceMeters.mockReturnValue(200);


    const orderData = {
      pickupLocation: {
        coordinates: [0, 0],
      },
      dropoffLocation: {
        coordinates: [1, 1],
      },
    };


    const result = calculateDeliveryPrice(orderData);


    expect(result).toEqual({
      baseFee: 50,
      distanceKm: 0.2,
      distanceFee: 10,
      total: 60,
    });

  });



  it('should handle zero distance correctly', () => {

    calculateDistanceMeters.mockReturnValue(0);


    const orderData = {
      pickupLocation: {
        coordinates: [0, 0],
      },
      dropoffLocation: {
        coordinates: [0, 0],
      },
    };


    const result = calculateDeliveryPrice(orderData);


    expect(result).toEqual({
      baseFee: 50,
      distanceKm: 0,
      distanceFee: 0,
      total: 50,
    });

  });

});