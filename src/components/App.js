import React, { Component } from 'react';
import {Grid} from 'semantic-ui-react'
import './App.css';
import { connect } from 'react-redux';

import ColorPanel from './ColorPanel/ColorPanel'
import SidePanel from './SidePanel/SidePanel'
import Messages from './Messages/Messages'
import MetaPanel from './MetaPanel/MetaPanel'


class App extends Component {
// const App = ({ currentUser, currentChannel }) => (
  render() {
    const { currentUser, currentChannel, isPrivateChannel, userPosts, primaryColor, secondaryColor } = this.props;
    return(

  // const App = () => (
  <Grid columns="equal" className="app" style={{ background: secondaryColor }}>
    <ColorPanel key={currentUser && currentUser.name} currentUser={currentUser}/>
    <SidePanel 
      key={currentUser && currentUser.id}
      currentUser={currentUser}
      primaryColor={primaryColor}
      />
    {/* <SidePanel />  */}
    <Grid.Column style={{ marginLeft: 320 }}>
      
      <Messages 
        key={currentChannel && currentChannel.id} 
        currentChannel={currentChannel}
        currentUser={currentUser}
        isPrivateChannel={isPrivateChannel}
      />
    </Grid.Column>
    <Grid.Column width={4}> 
      <MetaPanel 
        userPosts={userPosts}
        key={currentChannel && currentChannel.name} 
        currentChannel={currentChannel}
        isPrivateChannel={isPrivateChannel}
      />
    </Grid.Column>
  </Grid>
//)
    )}
}
const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  currentChannel: state.channel.currentChannel,
  isPrivateChannel: state.channel.isPrivateChannel,
  userPosts: state.channel.userPosts,
  primaryColor: state.colors.primaryColor,
  secondaryColor: state.colors.secondaryColor
})


export default connect(mapStateToProps)(App);
// export default App;
