import React, {Component} from 'react'
import { Segment, Button, Input } from 'semantic-ui-react'
import firebase from '../../firebase'
import FileModal from './FileModal'
import Progressbar from './Progressbar'
import uuidv4 from 'uuid/v4';



class MessageForm extends Component {

    // Get the props from Messages from App
    state = {
        message: '',
        channel: this.props.currentChannel,
        privateChannel: this.props.isPrivateChannel,
        user: this.props.currentUser,
        storageRef: firebase.storage().ref(),
        loading: false,
        errors: [],
        modal: false,
        uploadState: '',
        uploadTask: null,
        percentUploaded: 0
    }

    // componentDidMount(){
    //     if(this.state.channel){
    //         console.log("Channel ID", this.state.channel.id)
    //     this.props.loadMessage(this.state.channel.id)
    //     }
    // }

    /**
     * @param {event} event
     */
    handleChange = event => {
        this.setState({
            [event.target.name] : event.target.value
        })
    }

    sendMessage = () => {
        // Triggers parent componentDidMount Re-rendering
        const { getMessagesRef } = this.props;
        const { message, channel } = this.state
        if(message){
            this.setState({
                loading: true
            })
            getMessagesRef()
                .child(channel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({
                        loading: false,
                        message: '',
                    })
                })
                .catch(err => {
                    console.log(err)
                    this.setState({
                        loading: false,
                        errors: this.state.errors.concat(err)
                    })
                })
        }else{
            // if there's no message
            this.setState({
                errors: this.state.errors.concat({
                    message: 'Add a message'
                })
            })
        }
    }

    createMessage = (fileUrl = null) => {
        const message = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            // content: this.state.message,
            // get the current sender
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL
            }
        }
        // if theres an image send 
        if(fileUrl !== null){
            message['image'] = fileUrl
        }else{
            message['content'] = this.state.message
        }
        // returns a message either content or null together with its user
        return message
    }

    openModal = () => this.setState({ modal: true });

    closeModal = () => this.setState({ modal: false });

    getPath = () => {
        if(this.props.isPrivateChannel){
            return `chat/private-${this.state.channel.id}`;
        }else{
            return 'chat/public';
        }
    }

    // Uploads a file/image
    uploadFile = (file, metadata) => {
        console.log(file, metadata)
        const pathToUpload = this.state.channel.id
        const ref = this.props.messagesRef;
        const filePath = `${this.getPath()}/${uuidv4()}.jpg`;

        // const req = new XMLHttpRequest();
        // req.upload.addEventListener("progress")  

        this.setState({
            uploadState: 'uploading',
            uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
        }, 
        () => {
     
            this.state.uploadTask.on('state_changed', snap => {
                // a callback function to get the transfer bytes of the image
                const percentUploaded = Math.round(( snap.bytesTransferred / snap.totalBytes ) * 100);
                console.log("percentUploaded", percentUploaded)
                this.setState({
                    percentUploaded:percentUploaded
                });
            }, 
            err => {
                console.log(err)
                this.setState({
                    errors: this.state.errors.concat(err),
                    uploadState: 'error',
                    uploadTask: null
                })
            },
            () => {
                // another callback 
               this.state.uploadTask.snapshot.ref.getDownloadURL()
               .then(downloadUrl => {
                   this.sendFileMessage(downloadUrl, ref, pathToUpload)
               })
               .catch(err => {
                console.log(err)
                this.setState({
                    errors: this.state.errors.concat(err),
                    uploadState: 'error',
                    uploadTask: null
                })
               })
            })
        })
    }

    sendFileMessage = (fileUrl, ref, pathToUpload) => {
       
        ref.child(pathToUpload)
            .push()
            .set(this.createMessage(fileUrl)) // save/update Image URL
            .then(() => {
                this.setState({
                    uploadState: 'done'
                })
             
            })
            .catch(err => {
                console.log(err)
                this.setState({
                    errors: this.state.errors.concat(err)
                })
            })
    }

    render(){
        const { errors, message, loading, modal, uploadState, percentUploaded } = this.state

        return(
            <Segment className="message-form">
                <Input 
                    fluid
                    name="message"
                    onChange={this.handleChange}
                    style={{ marginBottom: '0.7em' }}
                    label={<Button icon={'add'}/>}
                    labelPosition="left"
                    className={
                        errors.some(error => error.message.includes('message')) ? 'error' : ''
                    }
                    value={message}
                    placeholder="Write your message"
                />
                <Button.Group icon widths="2">
                    <Button 
                        onClick={this.sendMessage}
                        color="purple"
                        content="Add Reply"
                        labelPosition="left"
                        icon="edit"
                        disabled={loading}
                    />
                    <Button 
                        disabled={uploadState === "uploading"}
                        onClick={this.openModal}
                        color="teal"
                        content="Upload Media"
                        labelPosition="right"
                        icon="cloud upload"
                    />
                    <FileModal
                        modal={modal}
                        closeModal={this.closeModal}
                        uploadFile={this.uploadFile}
                    />
                    
                </Button.Group>
                <Progressbar uploadState={uploadState} percentUploaded={percentUploaded}/>
            </Segment>
        )
    }
}

export default MessageForm
