import React, { Component } from "react";
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';


class Search extends Component {
  state = {
    searchValue: "",
    meals: []
    };
    handleOnChange = event => {
      this.setState({ searchValue: event.target.value });
      };
      handleSearch = () => {
        this.makeApiCall(this.state.searchValue);
        };

       makeApiCall = searchInput => {
       fetch(`https://api.crossref.org/works/${searchInput}`).then(data=>data.json())
       .then(dataSD=>this.setState({ meals:dataSD.message.reference}))
        };
        ;

render() {
  return (
    <div>
    <h1>Welcome to the references (Backward search) using DOI</h1>
    <input
name="text"
type="text"
placeholder="Search using DOI"
onChange={event => this.handleOnChange(event)}
value={this.state.searchValue}
/>
<button onClick={this.handleSearch}>Search</button>
<p></p>  
<Table striped bordered hover>
  <thead>
    <tr>
      <th>Title</th>
      <th>DOI</th>
      <th>Year</th>
    </tr>
  </thead>
  <tbody>
        {
               this.state.meals ? (this.state.meals.map((dynamicData) =>
                {return(
                  <tr>
                <td>{dynamicData.unstructured}</td>
                <td>{dynamicData.DOI}</td>
                <td>{dynamicData.year}</td>
                </tr>
                )
                })):<tr><td colSpan="5">Loading...</td></tr> }
                 
                </tbody>
                </Table> 
              
    </div>
    
    );
}
}
export default Search;