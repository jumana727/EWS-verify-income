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


app.get('/',(req,res)=>{
    res.send('Hello');
});

app.listen( 3000,()=>{
    console.log('server running on port 3000');
});
