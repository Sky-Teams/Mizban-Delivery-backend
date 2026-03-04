import request from 'supertest';

//Helper function to PUT requests in integration test
export const putWithAuth = (app, url, data, token) => {
  return request(app).put(url).send(data).set('Authorization', `Bearer ${token}`);
};
