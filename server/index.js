const express = require('express');
const cors = require('cors');
var axios = require('axios');
const localStorage = require('localStorage');
var jwkToPem = require('jwk-to-pem');

const app = express();

const uuid = require("./util/uuid");
const signature = require("./util/request_signing");
const requestData = require("./util/request_data");
const createData = require("./util/consent_detail");
const decrypt_data = require("./util/decrypt_data");


const fs = require('fs');
const { config } = require('dotenv');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/consent/:mobileNumber", (req, res) => {
    localStorage.setItem("consent", "Pending");
    let body = createData(req.params.mobileNumber);
    const privateKey = fs.readFileSync("./keys/private_key.pem", {
      encoding: "utf8",
    });
    let detachedJWS = signature.makeDetachedJWS(privateKey, body);
    var requestConfig = {
      method: "post",
      url: 'https://aa-sandbox.setu.co/Consent',
      headers: {
        "Content-Type": "application/json",
        client_api_key: '1b0a81b0-a783-45be-b99e-8f7f352420ff',
        "x-jws-signature": 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..lKSD73AxvGY7vgSWeXDKP_AMNSCDLhi210GCN7wlEvo_HwQwCxS8MMhT0-QRPusD0nszuMeGfjIFblKA58fmJjLkM6tz7Tv5UwVK1KMsOQbeuURtO7B8_n0rhXrHqcx0fsy7osbbUY2GnpsNv3NrsTvlL65zeu6xuESLx4ePX9C-jwh0_KPo9tGv41jtRn904cXUS5w-SlkTSYeZgorA_PmIaD0FIFY55sNDVMU5DP5_zEacEObTi0L6lQ-pGiiWeKuXWWBo3w3mw3ottQK1Gxp9mtfmvouBeMyogZ1zx8Q333X2sDVu3WQNiAZXLh3yHViU4j6XEdP9JRJz-fmk4g',
      },
      data: body,
    };
  
    axios(requestConfig)
      .then(function (response) {
        let url =
        "https://anumati.setu.co/" +
        response.data.ConsentHandle;
        res.send(url);
       
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
        console.log("Error");
      });
  });

  app.post("/Consent/Notification", (req, res) => {
    var body = req.body;
    console.log(body);
  
    let headers = req.headers;
    let obj = JSON.parse(fs.readFileSync("./keys/setu_public_key.json", "utf8"));
    let pem = jwkToPem(obj);
  
    if (signature.validateDetachedJWS(headers["x-jws-signature"], body, pem)) {
      let consent_id = body.ConsentStatusNotification.consentId;
      let consent_status = body.ConsentStatusNotification.consentStatus;
  
      localStorage.setItem("consent_id", consent_id);
      localStorage.setItem("consent_status", consent_status);
  
      if (consent_status === "ACTIVE") {
        fetchSignedConsent(consent_id);
      }
  
      const dateNow = new Date();
      res.send({
        ver: "1.0",
        timestamp: dateNow.toISOString(),
        txnid: uuid.create_UUID(),
        response: "OK",
      });
    } else {
      res.send("Invalid Signature");
    }
  });

  const fetchSignedConsent = (consent_id) => {
    const privateKey = fs.readFileSync("./keys/private_key.pem", {
      encoding: "utf8",
    });
    let detachedJWS = signature.makeDetachedJWS(
      privateKey,
      "/Consent/" + consent_id
    );
    var requestConfig = {
      method: "get",
      url: config.api_url + "/Consent/" + consent_id,
      headers: {
        "Content-Type": "application/json",
        client_api_key: '1b0a81b0-a783-45be-b99e-8f7f352420ff',
        "x-jws-signature": detachedJWS,
      },
    };
  
    axios(requestConfig)
      .then(function (response) {
        fi_data_request(response.data.signedConsent, consent_id);
      })
      .catch(function (error) {
        console.log(error);
        console.log("Error");
      });
  };

  const fi_data_request = async (signedConsent, consent_id) => {
    let keys = await requestData.generateKeyMaterial();
    let request_body = requestData.requestDataBody(
      signedConsent,
      consent_id,
      keys["KeyMaterial"]
    );
    const privateKey = fs.readFileSync("./keys/private_key.pem", {
      encoding: "utf8",
    });
    let detachedJWS = signature.makeDetachedJWS(privateKey, request_body);
    var requestConfig = {
      method: "post",
      url: config.api_url + "/FI/request",
      headers: {
        "Content-Type": "application/json",
        client_api_key: '1b0a81b0-a783-45be-b99e-8f7f352420ff',
        "x-jws-signature": detachedJWS,
      },
      data: request_body,
    };
  
    axios(requestConfig)
      .then(function (response) {
        // Ideally, after this step we save the session ID in your DB and wait for FI notification and then proceed.
        fi_data_fetch(
          response.data.sessionId,
          keys["privateKey"],
          keys["KeyMaterial"]
        );
      })
      .catch(function (error) {
        console.log(error);
        console.log("Error");
      });
  };
  
  ////// FI NOTIFICATION
  
  app.post("/FI/Notification", (req, res) => {
    var body = req.body;
    let headers = req.headers;
    let obj = JSON.parse(fs.readFileSync("./keys/setu_public_key.json", "utf8"));
    let pem = jwkToPem(obj);
  
    if (signature.validateDetachedJWS(headers["x-jws-signature"], body, pem)) {
      // Do something with body
      // Ideally you wait for this notification and then proceed with Data fetch request.
      const dateNow = new Date();
      res.send({
        ver: "1.0",
        timestamp: dateNow.toISOString(),
        txnid: uuid.create_UUID(),
        response: "OK",
      });
    } else {
      res.send("Invalid Signature");
    }
  });
  
  ////// FETCH DATA REQUEST
  
  const fi_data_fetch = (session_id, encryption_privateKey, keyMaterial) => {
    const privateKey = fs.readFileSync("./keys/private_key.pem", {
      encoding: "utf8",
    });
    let detachedJWS = signature.makeDetachedJWS(
      privateKey,
      "/FI/fetch/" + session_id
    );
    var requestConfig = {
      method: "get",
      url: config.api_url + "/FI/fetch/" + session_id,
      headers: {
        "Content-Type": "application/json",
        client_api_key: '1b0a81b0-a783-45be-b99e-8f7f352420ff',
        "x-jws-signature": detachedJWS,
      },
    };
    axios(requestConfig)
      .then(function (response) {
        decrypt_data(response.data.FI, encryption_privateKey, keyMaterial);
      })
      .catch(function (error) {
        console.log(error);
        console.log("Error");
      });
  };
  
  ///// GET DATA
  
  app.get("/get-data", (req, res) => {
    res.send(JSON.parse(localStorage.getItem("jsonData")));
  });


app.get('/',(req,res)=>{
    res.send('Hello');
});

app.listen( process.env.PORT || 3000,()=>{
    console.log('server running on port 3000');
});
