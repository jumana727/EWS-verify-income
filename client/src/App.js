import React from "react";
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Container } from "@material-ui/core";
import Home from './components/Home';
import Second from "./components/Second";
import Last from "./components/Last";

const App=() => {
  return (
    <BrowserRouter>
      
      <Container maxWidth="lg">
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/second" exact component={Second} />
        <Route path="/last" exact component={Last} />
      </Switch>
    </Container>

    </BrowserRouter>
    
  );
}

export default App;
