import request from 'supertest';

// helper function to send authenticated POST requests in integration tests
export const postWithAuth = async (app, url, data, token) => {
  return await request(app).post(url).send(data).set('Authorization', `Bearer ${token}`);
};
