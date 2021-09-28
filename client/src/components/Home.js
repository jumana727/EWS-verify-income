import React,{useState} from "react";
import { Typography,Button,Container, TextField } from "@material-ui/core";
import Second from "./Second";
import { useHistory } from "react-router-dom";
const Home = () =>{

    const [number,setNumber] = useState("");
    let history = useHistory();
    
    const handleSubmit = async()=>{
        try {
            const response = await fetch("https://ews-verify-income.herokuapp.com/consent/" + number);
            console.log(response);
            const json = await response.text();
            history.push({
                pathname: '/second',
                state: json,
              });

            console.log(json);
            

        } catch (error) {
            console.log(error);
            
        }
    }

    return(
        <Container>
            <TextField id="outlined-basic" variant='outlined' label='Enter Phone Number' value={number}  onChange={(e)=>{ setNumber(e.target.value)}}></TextField>
            <Button variant='contained' color='primary' onClick={handleSubmit}>Submit</Button>
            
        </Container>
        
    )
}

export default Home;