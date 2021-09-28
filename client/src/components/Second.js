import React from 'react';
import { useLocation,useHistory } from 'react-router-dom';



const Second =() =>{
    const location = useLocation();
    const history = useHistory();
    const redirectUrl = 'https://ews-verify-income.herokuapp.com/redirect';
    const route = location.state; 

    console.log(route);
    return(

        <iframe title="title" src= {route} height="800px" width="100%" onLoad={()=>{if(this.contentWindow.location === redirectUrl) history.push('/last')}}></iframe>
       
    )
}

export default Second;