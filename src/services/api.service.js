import axios from "axios";

const api = axios.create();
const baseURL = process.env.REACT_APP_API_URL;
const baseSESURL = process.env.REACT_APP_SES_API_URL;
api.defaults.headers = {
  "Content-Type": "*/*",
  Accept: "*/*",
  "Access-Control-Allow-Origin": "*",
  Authorization: process.env.REACT_APP_API_KEY,
};

class Api {
  async get(path) {
    return await api.get(`${baseURL}${path}`);
  }

  async post(path, data) {
    return await api.post(`${baseURL}${path}`, data);
  }

  async put(path, data) {
    return await api.put(`${baseURL}${path}`, data);
  }
}

class ApiSES {
  async post(path, data) {
    return await api.post(`${baseSESURL}${path}`, data);
  }
}

export const API = new Api();

export const APISES = new ApiSES();
