import React, { Component } from 'react';
import firebase from '../../firebase';
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions'

import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react';


class Channels extends Component {

    state = {
        user: this.props.currentUser,
        channel: null,
        channels: [],
        modal: false,
        channelsRef: firebase.database().ref('channels'),
        messagesRef: firebase.database().ref('messages'),
        typingRef: firebase.database().ref('typing'),
        notifcations: [],
        channelName: '',
        channelDetails: '',
        firstLoad: true,
        activeChannel: ''
    }


    closeModal = () => this.setState({ modal:false })

    openModal = () => this.setState({ modal:true })

    handleChange = event => {
        this.setState({
            [event.target.name]: event.target.value
        })
    }

    handleSubmit = event => {
        event.preventDefault();
        if(this.isFormValid(this.state)){
            this.addChannel()
        }
    }
    

    isFormValid = ({ channelName, channelDetails }) => channelName && channelDetails;

    addChannel = () => {
        const { channelsRef, channelName, channelDetails, user } = this.state
        const key = channelsRef.push().key

        const newChannel = {
            id: key,
            name: channelName,
            details: channelDetails,
            createdBy:{
                name: user.displayName,
                avatar: user.photoURL
            }
        }

        channelsRef
            .child(key)
            .update(newChannel)
            .then(() => {
                this.setState({
                    channelName: '',
                    channelDetails: ''
                })
                this.closeModal();
                console.log("Channel Added")
            }).catch(err => {
                console.log(err)
            })
    }

    componentDidMount(){
        // when state changes re renders
        console.log("addListeners")
        this.addListeners();
    }

    // Cleans up all method use in componentDidMount
    componentWillUnmount(){
        console.log("removeListners")
        this.removeListners();
    }

    removeListners = () => {
        this.state.channelsRef.off()
    }


    addListeners = () => {
        // Get / Load all channels from firebase db
        let loadedChannels = [];
        // get all the data from the channel document and retrigger when child is added
   
        this.state.channelsRef.on('child_added', snap => {
            loadedChannels.push(snap.val());
            // call a callback function a fter setting the state
            this.setState({
                channels: loadedChannels
            }, () => {
                // console.log(this.state.channels.length )
                this.setFirstChannel()
                // if(this.state.channels.length === 1){
                  
                // }
            })
            this.addNotificationListener(snap.key);
        })
    }


    addNotificationListener = channelId => {
        // get all the value from the message document re triggers if document is change 
        // Handle a new value
        this.state.messagesRef.child(channelId).on('value', snap => {
            if(this.state.channel){
                // console.log(snap.val())
                this.handleNotifications(channelId, this.state.channel.id, this.state.notifcations, snap)
            }
        })
    }

    /**
     * @param { Array } notifcations
     * @param { String } channelId
     * @param { firebase.database.DataSnapshot } snap
     */
    handleNotifications = (channelId, currentChannelId, notifcations, snap) => {
        let lastTotal = 0;
        // find the index where notification id = channel id
        let index = notifcations.findIndex(notification => notification.id === channelId);
        if(index !== -1){
            if(channelId !== currentChannelId){
                lastTotal = notifcations[index].total;

                if(snap.numChildren() - lastTotal > 0){
                    notifcations[index].count = snap.numChildren() - lastTotal
                }
            }
            notifcations[index].lastKnownTotal = snap.numChildren();
        }else{
            notifcations.push({
                id: channelId,
                total: snap.numChildren(),
                lastKnownTotal: snap.numChildren(),
                count: 0
            })
        }
        this.setState({ notifcations: notifcations })
    }

    clearNotifications = () => {
        let index = this.state.notifcations.findIndex(notification => notification.id === this.state.channel.id);
        if(index !== -1){
            // Get a copy of notificaitons
            let updatedNotifications = [...this.state.notifcations];
            updatedNotifications[index].total = this.state.notifcations[index].lastKnownTotal;
            updatedNotifications[index].count = 0;
            this.setState({
                notifcations: updatedNotifications
            })
        }
    }

 

    displayChannels = channels => (
        channels.length > 0 && channels.map(channel => (
            <Menu.Item
                key={channel.id}
                onClick={() => this.changeChannel(channel)}
                name={channel.name}
                style={{ opacity: 0.7 }}
                active={channel.id === this.state.activeChannel}
            >
                {this.getNotificationCount(channel) && (
                    <Label color="red">{this.getNotificationCount(channel)}</Label>
                )}
                # {channel.name}

            </Menu.Item>
        ))
    )

      // an action use to set channel to global state
      changeChannel = channel => {
        this.setActiveChannel(channel);
        this.state.typingRef
            .child(this.state.channel.id)
            .child(this.state.user.uid)
            .remove()
        this.props.setCurrentChannel(channel);
        this.props.setPrivateChannel(false);
        this.clearNotifications();
        this.setState({ channel: channel });
    }

    setFirstChannel = () => {
        // console.log('Set first channel' , this.state.channels[0])
        // get the first element from the channels array
        const firstChannel = this.state.channels[0]
        // console.log("firstChannel", firstChannel)
        if(this.state.firstLoad && this.state.channels.length > 0){
            this.props.setCurrentChannel(firstChannel)
            this.setActiveChannel(firstChannel)
            this.setState({ channel: firstChannel })
        }
        this.setState({ firstLoad: false })
        
    }

    
  
    setActiveChannel = channel => {
        this.setState({
            activeChannel: channel.id
        })
    }


    getNotificationCount = channel => {
        let count = 0;
        this.state.notifcations.forEach(notifcation => {
            if(notifcation.id === channel.id ){
                count = notifcation.count;
            }
        })

        if(count > 0) return count;
    }

    render() {
        const { channels, modal } = this.state
        return (
            <React.Fragment>

            <Menu.Menu className="menu">
                <Menu.Item>
                    <span>
                        <Icon name="exchange"/> CHANNELS
                    </span>{" "}
                    ({ channels.length }) <Icon onClick={this.openModal} style={{ cursor: 'pointer' }} name="add"/>
                </Menu.Item>
                {/* Channels */}
                {this.displayChannels(channels)}
            </Menu.Menu>

            {/* Add Channel Modal */}
            <Modal basic open={modal} onClose={this.closeModal}>
                <Modal.Header>Add a Channel</Modal.Header>
                <Modal.Content>
                    <Form onSubmit={this.handleSubmit}>
                        <Form.Field>
                            <Input
                                fluid
                                label="Name of Channel"
                                name="channelName"
                                onChange={this.handleChange}
                            />
                        </Form.Field>
                        <Form.Field>
                            <Input
                                fluid
                                label="About the Details"
                                name="channelDetails"
                                onChange={this.handleChange}
                            />
                        </Form.Field>
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button color="green" inverted onClick={this.handleSubmit}>
                        <Icon name="checkmark" /> Add
                    </Button>
                    <Button color="red" inverted onClick={this.closeModal}>
                        <Icon name="remove" /> Cancel
                    </Button>
                </Modal.Actions>
            </Modal>
        </React.Fragment>
        )
    }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Channels)