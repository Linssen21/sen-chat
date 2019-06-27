import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import * as serviceWorker from './serviceWorker';
import {BrowserRouter, Switch, Route, withRouter} from 'react-router-dom';
import firebase from './firebase';
import {createStore} from 'redux';
import { Provider, connect } from 'react-redux'
import { composeWithDevTools } from 'redux-devtools-extension';
import 'semantic-ui-css/semantic.min.css'
import rootReducer from './reducers';
import {setUser, clearUser} from './actions/index'
import Spinner from './spinner'

const store = createStore(rootReducer, composeWithDevTools())


// Checks first if Logged In
// const AuthRoute = (props) => {
//     // if not loggedIn
//     firebase.auth().onAuthStateChanged(user => {
//         if(user){
//             // get from actions using connect method 
//             return this.props.setUser(user)
//                 .then(() => {
//                     this.props.history.push('/')
//                     const { component, path } = props;

//                     return <Route path={path} component={component}/>;
//                 })
            
//         }else{
//             this.props.history.push('/login')
//             this.props.clearUser();
//         }
//     })

   
// }

class Root extends Component {
    _isMounted = false;
    // redirects if authenticated
    componentDidMount(){
        this._isMounted = true;
        // console.log(this.props.isLoading)
        firebase.auth().onAuthStateChanged(user => {
            if(user !== null){
            console.log(`USER ${user.displayName}`);
            }
            if(user){
                // get from actions using connect method 
                this.props.setUser(user)
                this.props.history.push('/')
            }else{
                this.props.history.push('/login')
                this.props.clearUser();
            }
        })
    }

    componentWillUnmount() {
        this._isMounted = false;
      }

    render() {
       return this.props.isLoading ? <Spinner /> : (
           
        <Switch>
            <Route exact path='/' component={App}/>
            <Route path='/login' component={Login}/>
            <Route path='/register' component={Register}/>
        </Switch>
           
        )
    }
}

// Maps the state from reducers
const mapStateFromProps = state => ({
    isLoading: state.user.isLoading
})

const RootWithAuth = withRouter(connect(mapStateFromProps, { setUser, clearUser })(Root));

ReactDOM.render(  
    <Provider store={store}>
    <BrowserRouter>
        <RootWithAuth />
    </BrowserRouter>
    </Provider>,
 document.getElementById('root')
 );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
