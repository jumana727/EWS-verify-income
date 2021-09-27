"use strict";
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  api_url: process.env.API_URL,
  app_url: process.env.ANUMATI_URL,
  client_api_key: process.env.CLIENT_API_KEY,
  rahasya_url: process.env.RAHASYA_URL,
};