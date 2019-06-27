import firebase from 'firebase/app';
import "firebase/auth"
import "firebase/database"
import "firebase/storage"


var firebaseConfig = {
    apiKey: "AIzaSyCY0CXipkWDSeGqk92g6lQZEXZqpXLhKls",
    authDomain: "react-chat-2ef45.firebaseapp.com",
    databaseURL: "https://react-chat-2ef45.firebaseio.com",
    projectId: "react-chat-2ef45",
    storageBucket: "react-chat-2ef45.appspot.com",
    messagingSenderId: "68144010681",
    appId: "1:68144010681:web:0b873772d567e71e"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase;