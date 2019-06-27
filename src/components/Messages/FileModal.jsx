import React, { Component } from 'react'
import { Modal, Input, Button, Icon } from 'semantic-ui-react'
import mime from 'mime-types'

class FileModal extends Component {

    state = {
        file: null,
        authorized: ['image/jpeg', 'image/png']
    }

    constructor(props) {
        super(props)
        this.fileInput = null;
        /**
         * @param {event} element
         */
        this.setFileInput = element => {
            this.fileInput = element
        }

        this.clearFileInput = () => {
            console.log(this.fileInput)
            if(this.fileInput){
                this.fileInput.value = "";
            }
        }
    }

  

   
    /**
     * @param {event} event
     */
    addFile = event => {
        const file = event.target.files[0];
        // console.log(file)
        if(file && this.isAuthorized(file.name)){
            this.setState({
                file: file
            })
        }else{
            console.log("File Invalid");
            // event.target.value = null
        }
    }

    sendFile = () => {
        const { uploadFile, closeModal } = this.props
        const { file } = this.state;
        if(file !== null){
            if(this.isAuthorized(file.name)){
                // Send file
                const metadata = { contentType: mime.lookup(file.name) }
                uploadFile(file ,metadata);
                closeModal();
                this.clearFile();
            }else{
                console.log("invalid")
                this.clearFileInput()
            }
        }
    }

    // check the mime type base on its file name
    // .includes determine if an arrays will return true or false
    isAuthorized = filename => this.state.authorized.includes(mime.lookup(filename))

    clearFile = () => this.setState({ file: null });


    render() {
        const { modal, closeModal } = this.props;
        return (
           <Modal basic open={modal} onClose={closeModal}>
               <Modal.Header>Select an Image File</Modal.Header>
               <Modal.Content>
                   <Input
                        onChange={this.addFile}
                        fluid
                        label="File types: jpeg, png"
                        name="file"
                        type="file"
                        ref={this.setFileInput}
                   />
               </Modal.Content>
               <Modal.Actions>
                   <Button onClick={this.sendFile} color="green" inverted>
                        <Icon name="checkmark"/>
                        Send
                   </Button>
                   <Button color="red" inverted onClick={closeModal}>
                   <Icon name="close"/>
                   Cancel
                   </Button>
               </Modal.Actions>
           </Modal>
        )
    }
}

export default FileModal
