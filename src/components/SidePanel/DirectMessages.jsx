import React, { Component } from 'react'
import { Menu, Icon } from 'semantic-ui-react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions'


class DirectMessages extends Component {
    
    state = {
        user: this.props.currentUser,
        users: [],
        activeChannel: '',
        usersRef: firebase.database().ref('users'),
        connectedRef: firebase.database().ref('.info/connected'), // check if users are connected or not
        presenceRef: firebase.database().ref('presence')
    }

    componentDidMount(){
        if(this.state.user){
            this.addListeners(this.state.user.uid)
        }
    }

     // Cleans up all method use in componentDidMount
     componentWillUnmount(){
        console.log("removeListners")
        this.removeListners();
    }

    removeListners = () => {
        this.state.usersRef.off()
    }

    /**
     * @param {String} currentUserId
     *  automatically calls listeners if change is detected in firebase
     */
    addListeners = currentUserId => {
        let loadedUsers = [];
        // re renders when a change is detected if fbase.
        // func like websockets
        this.state.usersRef.on('child_added', snap => {
            let user = snap.val();
            user['uid'] = snap.key;
            user['status'] = 'offline';
            loadedUsers.push(user)
            // when change detect push to the array and update the state
            this.setState({ 
                users: loadedUsers
            });
        });
        // check if theres a change in the value
        this.state.connectedRef.on('value', snap => {
            if(snap.val() === true){
                // tracks users if online
                const ref = this.state.presenceRef.child(currentUserId);
                ref.set(true);
                ref.onDisconnect().remove(err => {
                    if(err !== null){
                        console.log(err)
                    }
                })
            }
        });

        // automatically calls if online
        this.state.presenceRef.on('child_added', snap => {
            if(currentUserId !== snap.key){
                // add status to user
                this.addStatusToUser(snap.key)
            }
        });
        // automatically calls if not online
        this.state.presenceRef.on('child_removed', snap => {
            if(currentUserId !== snap.key){
                // add status to user
                this.addStatusToUser(snap.key, false)
            }
        });

    }
    
    /**
     * @param {String} userId
     * @param {Boolean} connected
     */
    addStatusToUser = (userId, connected = true) => {
        const updatedUsers = this.state.users.reduce((accumulator, user) => {
            // check if user is under direct message
            if(user.uid === userId){
                // update user status if online or offline
                user['status'] = `${connected ? 'online' : 'offline'}`
            }
            // returns an array of loaded users
            return accumulator.concat(user);
        }, []);
        this.setState({ users: updatedUsers })
    }

    isUserOnline = user => user.status === 'online';

    changeChannel = user => {
        const channelId = this.getChannelId(user.uid);
        const channelData = {
            id: channelId,
            name: user.name
        }
        this.props.setCurrentChannel(channelData);
        this.props.setPrivateChannel(true)
        this.setActiveChannel(user.uid)
    }

    setActiveChannel = userId => {
        this.setState({ activeChannel: userId })
    }

    // Channel Id of current user and other select user
    getChannelId = userId => {
        const currentUserId = this.state.user.uid;
        // console.log(`userId ${userId} currentUserId ${currentUserId}`)
        return userId < currentUserId ? `${userId}/${currentUserId}` : `${currentUserId}/${userId}`
    }

    render() {
        const { users, activeChannel } = this.state;

        return (
           <Menu.Menu className="menu">
               <Menu.Item>
                <span>
                    <Icon name="mail" />
                    DIRECT MESSAGES
                </span> {' '}
                ({ users.length })
               </Menu.Item>
               {/* Users to send Direct Message */}
               { 
                users.map(user => {
                   return <Menu.Item
                        key={user.uid}
                        onClick={() => this.changeChannel(user)}
                        style={{ opacity: 0.7, fontStyle: 'italic' }}
                        active={user.uid === activeChannel}
                    >
                    <Icon 
                        name="circle"
                        color={this.isUserOnline(user) ? 'green' : 'red'}
                    />
                    @ {user.name}
                    </Menu.Item>
                })
               }
           </Menu.Menu>
        )
    }
}



export default connect(null, { setCurrentChannel, setPrivateChannel })(DirectMessages)
