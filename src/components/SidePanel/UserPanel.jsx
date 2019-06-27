import React, { Component } from 'react'
import { Grid, Header, Icon, Dropdown, Image, Modal, Input, Button } from 'semantic-ui-react';
// import { connect } from 'react-redux'
import firebase from '../../firebase'
import AvatarEditor from 'react-avatar-editor'

class UserPanel extends Component {
    
    state = {
        // user: null
        user: this.props.currentUser,
        modal: false,
        previewImage: '',
        croppedImage: '',
        blob: '',
        storageRef: firebase.storage().ref(),
        userRef: firebase.auth().currentUser,
        usersRef: firebase.database().ref('users'),
        meatadata: {
            contentType: 'image/jpeg'
        },
        uploadedCroppedImage: ''
    }

    openModal = () => this.setState({ modal: true })
    closeModal = () => this.setState({ modal: false })

    constructor(props){
        super(props);
        if(this.props.currentUser.displayName == null){
            // window.location.reload();
        }
    }
    

    dropdownOptions = () => [
        {
            key: "user",
            text: <span>Signed in as <strong>{this.state.user && this.state.user.email}</strong></span>,
            disabled: true
        },
        {
            key: "avatar",
           text: <span onClick={this.openModal}>Change Avatar</span> 
        },
        {
            key: "signout",
            text: <span onClick={this.handleSignOut}>Sign Out</span>
        }
    ];

    handleSignOut = () => {
        firebase
            .auth()
            .signOut()
            .then(() => console.log("Signed Out!"))
    }

    /**
     * @method
     * @name handleChange
     * @param {event} event
     * set the preview image
     */
    handleChange = event => {
        const file = event.target.files[0];
       /**
        * @type {FileReader}
        * Lets web applications asynchronously read the contents of files (or raw data buffers)
        */
        const reader = new FileReader();

        if(file){
            reader.readAsDataURL(file);
            reader.addEventListener('load', () => {
                this.setState({ previewImage: reader.result })
            })
        }
    }

    // Set The cropedImage
    handleCropImage = () => {
        // get ref from previewImage "avatarEditor"
        if(this.avatarEditor){
            this.avatarEditor.getImageScaledToCanvas().toBlob(blob => {
                let imageUrl = URL.createObjectURL(blob);
                this.setState({
                    croppedImage: imageUrl,
                    blob: blob
                })
            })
        }
    }

    uploadCroppedImage = () => {
        const { storageRef, userRef, meatadata, blob } = this.state;
        storageRef
            .child(`avatar/user-${userRef.uid}`)
            .put(blob, meatadata)
            .then(snap => {
                snap.ref.getDownloadURL()
                .then(downloadUrl => {
                    this.setState({
                        uploadedCroppedImage: downloadUrl
                    }, () => this.changeAvatar())
                });
            });
    }

    // Upload avatar of current user
    changeAvatar = () => {
        this.state.userRef
            .updateProfile({
                photoURL: this.state.uploadedCroppedImage
            })
            .then(() => {
                console.log('Photo Url uploaded')
                this.closeModal();
            })
            .catch(err => console.log(err))

        this.state.usersRef
            .child(this.state.user.uid)
            .update({ avatar: this.state.uploadedCroppedImage })
            .then(() => {
                console.log('User avatar updated')
            })
            .catch(err => console.error(err))
    }
    
  
    render() {
        
        const { user, modal, previewImage, croppedImage,  } = this.state;
        const {primaryColor} = this.props;
        // console.log(user);
        // console.log(this.props.currentUser);
        return (
            <div>
            <Grid style={{ background: primaryColor }}>
                <Grid.Column>
                    <Grid.Row style={{ padding: '1.2em', margin: 0 }}>
                        <Header inverted floated="left" as="h2">
                            <Icon name="send"/>
                            <Header.Content>SenChat</Header.Content>
                        </Header>
                         {/* User DropDown */}
                        <Header style={{ padding: '0.25em'}} as="h4" inverted>
                            <Dropdown trigger={<span>
                            <Image src={ user.photoURL } spaced="right" avatar/> 
                            { user.displayName == null ? user.email : user.displayName }</span>} options={this.dropdownOptions()}/>
                            {/* <Dropdown trigger={
                                <span>User</span>
                            } options={this.dropdownOptions}/> */}
                        </Header>
                    </Grid.Row>
                   {/* Change User avatar modal */}
                   <Modal basic open={modal} onClose={this.closeModal}>
                        <Modal.Header>Change Avatar</Modal.Header>
                        <Modal.Content>
                            <Input 
                                onChange={this.handleChange}
                                fluid
                                type="file"
                                label="New Avatar"
                                name="previewImage"
                            />
                            <Grid centered stackable columns={2}>
                                <Grid.Row centered>
                                    <Grid.Column className="ui centered aligned grid">
                                    {/* Image Preview */}
                                    {previewImage &&(
                                        <AvatarEditor
                                            ref={node => (this.avatarEditor = node)}
                                            image={previewImage}
                                            width={120}
                                            height={120}
                                            border={50}
                                            scale={1.2}
                                        />
                                    )}
                                    </Grid.Column>
                                    <Grid.Column>
                                        {/* Cropped image preview */}
                                        {croppedImage && (
                                            <Image
                                                style={{ margin: '3.5em auto' }}
                                                width={100}
                                                height={100}
                                                src={croppedImage}
                                            />
                                        )}
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Modal.Content>
                        <Modal.Actions>
                            { croppedImage && <Button color="green" inverted onClick={this.uploadCroppedImage}>
                                <Icon name="save"/> Change Avatar
                            </Button>}
                            <Button color="green" inverted onClick={this.handleCropImage}>
                                <Icon name="image"/> Preview
                            </Button>
                            <Button color="red" inverted onClick={this.closeModal}>
                                <Icon name="remove"/> Cancel
                            </Button>
                        </Modal.Actions>
                   </Modal>
                </Grid.Column>
            </Grid>
            </div>
        )
    }
}

// const mapStateToProps = state => ({
//     currentUser: state.user.currentUser
// })

// export default connect(mapStateToProps)(UserPanel)
export default UserPanel