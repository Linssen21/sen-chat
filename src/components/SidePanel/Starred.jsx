import React, { Component } from 'react'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import { Menu, Icon } from 'semantic-ui-react';
import firebase from '../../firebase'

class Starred extends Component {
    
    state = {
        activeChannel: '',
        starredChannels: [],
        user: this.props.currentUser,
        usersRef: firebase.database().ref("users")
    }

    componentDidMount(){
        if(this.state.user){
            this.addListeners(this.state.user.uid);
        }
       
    }

    addListeners = userId => {
         // This event will be triggered once every time a child is added.
        this.state.usersRef
            .child(userId)
            .child('starred')
            .on('child_added', snap => {
                const starredChannel =  { id: snap.key, ...snap.val() };
                this.setState({
                    starredChannels: [...this.state.starredChannels, starredChannel]
                });
            });
        // This event will be triggered once every time a child is removed. 
        // The DataSnapshot passed into the callback will be the old data for the child that was removed.
        this.state.usersRef
        .child(userId)
        .child("starred")
        .on("child_removed", snap => {
            console.log('Remove Child')
            const channelToRemove = { id: snap.key, ...snap.val() };
            // filters channel were all channels is not equal to channels to removed
            const filteredChanels = this.state.starredChannels.filter(channel => {
                return channel.id !== channelToRemove.id;
            });
            console.log(filteredChanels)
            this.setState({
                starredChannels: filteredChanels
            });

        });
    }

    displayChannels = starredChannels => (
        starredChannels.length > 0 && 
        starredChannels.map(channel => (
            <Menu.Item
                key={channel.id}
                onClick={() => this.changeChannel(channel)}
                name={channel.name}
                style={{ opacity: 0.7 }}
                active={channel.id === this.state.activeChannel}
            >
            
                # {channel.name}

            </Menu.Item>
        ))
    );
    

    setActiveChannel = channel => {
        this.setState({
            activeChannel: channel.id
        })
    }

      // an action use to set channel to global state
      changeChannel = channel => {
        this.setActiveChannel(channel);
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
        // this.setState({ channel: channel });
    }
    
    render() {
        const { starredChannels } = this.state
        return (
            <Menu.Menu className="menu">
            <Menu.Item>
                <span>
                    <Icon name="exchange"/> STARRED
                </span>{" "}
                ({ starredChannels.length }) 
            </Menu.Item>
            {/* Channels */}
            {this.displayChannels(starredChannels)}
        </Menu.Menu>
        )
    }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Starred);
