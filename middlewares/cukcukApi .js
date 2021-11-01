const axios = require("axios");

const cukcukApi = axios.create({
  baseURL: process.env.REACT_APP_CUKCUK_API + "/api",
  headers: {
    CompanyCode: "bake",
    "Content-Type": "application/json",
  },
});

/**
 * console.log all requests and responses
 */
cukcukApi.interceptors.request.use(
  (request) => {
    return request;
  },
  function (error) {
    console.log("REQUEST ERROR", error);
  }
);

cukcukApi.interceptors.response.use(
  (response) => {
    if (response.data.Data && response.data.Data.AccessToken) {
      cukcukApi.defaults.headers.common["authorization"] =
        "Bearer " + response.data.Data.AccessToken;
    }
    return response;
  },
  function (error) {
    error = error.response.data;
    let errorMsg = error.message || "";
    if (error.errors && error.errors.message)
      errorMsg = errorMsg + ": " + error.errors.message;
    return Promise.reject(error);
  }
);

module.exports = cukcukApi;
