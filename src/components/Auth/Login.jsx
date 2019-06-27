import React, {Component} from 'react';
import { Grid, Form, Segment, Button, Header, Message, Icon } from 'semantic-ui-react'
import {Link} from 'react-router-dom'
import firebase from '../../firebase'



class Login extends Component {
  
    state = {
        email: '',
        password: '',
        errors : [],
        loading: false,
    }

    /**
     * @param {event} event - access document events of a component
     * Update the state onChange Event in inputfields
     */
    handleChange = event => {
        this.setState({
           [event.target.name] : event.target.value
        })
    }
  

    /**
     * @param {Array} errors
     *  Maps and display all errors
     */
    displayErrors = errors => errors.map((error, key) => <p key={key}>{error.message}</p>)

    /**
     * @param {event} event
     */
    handleSubmit = event => { 
        event.preventDefault(); // prevent from submitting the form
        if(this.isFormValid(this.state)){
            this.setState({errors: [], loading: true})
            firebase
                .auth()
                .signInWithEmailAndPassword(this.state.email, this.state.password)
                .then(signedInUser => {
                    console.log(signedInUser)
                })
                .catch(err => {
                    console.log(err)
                    this.setState({
                        errors: this.state.errors.concat(err),
                        loading: false
                    })
                })
            
        }
    }

    
    isFormValid = ({ email, password }) => email && password;


    handleInputError = (errors, inputName) => {
        // console.log(errors);
        return errors.some(error => 
            error.message.toLowerCase().includes(inputName)
        ) ?
            "error" :
            ""
    }

    render() {
        const { email, password, errors, loading } = this.state;
        return(
           <Grid textAlign="center" verticalAlign="middle" className="app"> {/* Set everything in the middle in X and Y axis */}
                <Grid.Column style={{ maxWidth:450 }}>
                    <Header as="h1" icon color="purple" textAlign="center">
                        <Icon name="code branch" color="purple"/>
                        Login to SenChat
                    </Header>
                    <Form onSubmit={this.handleSubmit} size="large">
                        <Segment stacked>
                         
                            <Form.Input 
                                fluid name="email" 
                                icon="mail" 
                                iconPosition="left" 
                                placeholder="Email Address" 
                                onChange={this.handleChange} 
                                value={email} 
                                className={this.handleInputError(errors, "email")}
                                type="email"
                            />
                            <Form.Input 
                                fluid 
                                name="password" 
                                icon="lock" 
                                iconPosition="left" 
                                placeholder="Password" 
                                onChange={this.handleChange} 
                                value={password}
                                className={this.handleInputError(errors, "password")}
                                type="password"
                            />
                           
                            <Button disabled={loading} className={loading ? 'loading' : ''} color="purple" fluid size="large">Submit</Button>
                        </Segment>
                    </Form>
                    {errors.length > 0 && (
                        <Message error>
                            <h3>Error</h3>
                            {this.displayErrors(errors)}
                        </Message>
                    )}
                    <Message>Don't have an account? <Link to="/register">Register</Link></Message>
                </Grid.Column>
           </Grid>
        )
    }
}

export default Login