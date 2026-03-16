import request from 'supertest';

// helper function to send authenticated POST requests in integration tests
export const postWithAuth = (app, url, data, token) => {
  return request(app).post(url).send(data).set('Authorization', `Bearer ${token}`);
};

export const getWithAuth = async (app, url, token) => {
  return request(app).get(url).set('Authorization', `Bearer ${token}`);
};
