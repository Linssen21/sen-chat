import React, {Component} from 'react'
import { Segment, Button, Input } from 'semantic-ui-react'
import firebase from '../../firebase'
import FileModal from './FileModal'
import Progressbar from './Progressbar'
import uuidv4 from 'uuid/v4';
import { Picker, emojiIndex } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';



class MessageForm extends Component {

    // Get the props from Messages from App
    state = {
        message: '',
        channel: this.props.currentChannel,
        privateChannel: this.props.isPrivateChannel,
        user: this.props.currentUser,
        storageRef: firebase.storage().ref(),
        typingRef: firebase.database().ref('typing'),
        loading: false,
        errors: [],
        modal: false,
        uploadState: '',
        uploadTask: null,
        percentUploaded: 0,
        emojiPicker: false,
    }



    /**
     * @param {event} event - message
     */
    handleChange = event => {
        this.setState({
            [event.target.name] : event.target.value
        })
    }
    
    /**
     * this function triggers from onKeyDown Event 
     * Creates a new document typing and store a child
     * if message === null remove child
     * @param {KeyboardEvent} event
     * @summary
     * typing : {
     *    channel.id : {
     *        user.id : user.displayname
     *    }
     * }
     */
    handleKeyDown = event => {
        if(event.ctrlKey && event.keyCode === 13){
            this.sendMessage();
        }
        const {message, typingRef, channel, user} = this.state;

        if(message){
            typingRef
                .child(channel.id)
                .child(user.uid)
                .set(user.displayName)
        }else{
            typingRef
            .child(channel.id)
            .child(user.uid)
            .remove()
        }
    }

    handleTogglePicker = () => {
        this.setState({ emojiPicker: !this.state.emojiPicker })
    }
    /**
     * {
        id: 'smiley',
        name: 'Smiling Face with Open Mouth',
        colons: ':smiley:',
        text: ':)',
        emoticons: [
            '=)',
            '=-)'
        ],
        skin: null,
        native: '😃'
        }
     */
    handleAddEmoji = emoji => {
        console.log(emoji)
        const oldMessage = this.state.message;
        const newMessage = this.colonToUnicode(`${oldMessage} ${emoji.colons}`);
        this.setState({ message: newMessage, emojiPicker: false })
    }
    /**
     * @param {String} message
     * Converts emoji to unicode based on emoji index
     */
    colonToUnicode = message => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
          x = x.replace(/:/g, "");
          let emoji = emojiIndex.emojis[x];
          if (typeof emoji !== "undefined") {
            let unicode = emoji.native;
            if (typeof unicode !== "undefined") {
              return unicode;
            }
          }
          x = ":" + x + ":";
          return x;
        });
      };

    sendMessage = () => {
        // Triggers parent componentDidMount Re-rendering
        const { getMessagesRef } = this.props;
        const { message, channel, user, typingRef } = this.state
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
                        errors: []
                    });
                    typingRef
                        .child(channel.id)
                        .child(user.uid)
                        .remove()
                })
                .catch(err => {
                    console.log(err)
                    this.setState({
                        loading: false,
                        errors: this.state.errors.concat(err)
                    });
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

    /**
     * A function for creating a message
     * @param {String} fileUrl
     * @return { Object } message object
     * 
     * @example
     *      createMessage("http://fileurl/")
     */
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
       
        const { errors, message, loading, modal, uploadState, percentUploaded, emojiPicker } = this.state

        return(
            <Segment className="message-form">
               {emojiPicker && (
                   <Picker 
                    set="google" 
                    onSelect={this.handleAddEmoji}
                    className="emojipicker" 
                    title="Pick your Emoji"
                    emoji="point_up"
                    />
               )}
                <Input 
                    fluid
                    name="message"
                    ref={node => (this.messageInputRef = node)}
                    onKeyDown={this.handleKeyDown}
                    onChange={this.handleChange}
                    style={{ marginBottom: '0.7em' }}
                    label={
                        <Button 
                            icon={emojiPicker ? 'close' : 'add'} 
                            content={emojiPicker ? "Close" : null}
                            onClick={this.handleTogglePicker}
                        />
                    }
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
