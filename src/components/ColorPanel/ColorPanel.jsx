import React, { Component } from 'react'
import { Sidebar, Menu, Divider, Button, Modal, Icon, Label, Segment } from 'semantic-ui-react';
import { connect } from 'react-redux'
import { SliderPicker } from 'react-color';
import firebase from '../../firebase'
import { setColors } from '../../actions'

 class ColorPanel extends Component {

    state = {
        modal:false,
        primary: "#408fbf",
        secondary: "#194d4a",
        usersRef: firebase.database().ref('users'),
        user: this.props.currentUser ,
        loading: false,
        userColors: []
    }

    componentDidMount(){
        if(this.state.user){
            this.addListeners(this.state.user.uid)
        }
    }

    
    addListeners = userId => {
        let userColors = [];
        this.state.usersRef
            .child(`${userId}/colors`)
            .on('child_added', snap => {
                userColors.unshift(snap.val());
                // console.log(userColors)
                this.setState({
                    userColors: userColors
                })
            });
    }
    
    componentWillUnmount(){
        this.reomoveListener();
    }

    reomoveListener = () => {
        this.state.usersRef.child(`${this.state.user.uid}/colors`).off();
    }

    openModal = () => this.setState({ modal: true });
    closeModal = () => this.setState({ modal: false });

    handleChangePrimary = color => this.setState({ primary: color.hex });
    handleChangeSecondary = color => this.setState({ secondary: color.hex });

    handleStateColors = () => {
        if(this.state.primary && this.state.secondary){
            this.saveColors(this.state.primary, this.state.secondary);
        }
    }

    saveColors = (primary, secondary) => {
        this.setState({loading: true})
        this.state.usersRef
            .child(`${this.state.user.uid}/colors`)
            .push()
            .update({
                primary, secondary
            })
            .then(() => {
                console.log("Colors Added")
                this.setState({loading: false})
                this.closeModal();
            })
            .catch(err => {
                this.setState({loading: false})
                console.error(err)
            })
    }

    displayUserColors = colors => (
        colors.length > 0 && colors.map((color, index) => {
            return <React.Fragment key={index}>
                <Divider/>
                {/* uses arrow function to pass the arguments */}
                <div className="color-container" 
                onClick={() => this.props.setColors(color.primary, color.secondary)}>
                    <div className="colors-square" style={{ background: color.primary }}>
                        <div className="color-overlay" style={{ background: color.secondary }}>

                        </div>
                    </div>
                </div>
            </React.Fragment>
        })
    );
    
    render() {
        const { modal, primary, secondary, loading, userColors } = this.state;

        return (
            <Sidebar
                as={Menu}
                icon="labeled"
                inverted
                vertical
                visible
                width={"very thin"}
            >
            <Divider/>
            <Button icon="add" size="small" color="blue" onClick={this.openModal}/>
            {this.displayUserColors(userColors)}
            {/* Color Picker Modal */}
            <Modal basic open={modal} onClose={this.closeModal}>
                <Modal.Header>Choose App Colors</Modal.Header>
                <Modal.Content>
                    <Segment >
                        <Label content="Primary Color" />
                        <SliderPicker color={primary} onChange={this.handleChangePrimary}/>
                    </Segment>
                    <Segment >
                        <Label content="Secondary Color" />
                        <SliderPicker color={secondary} onChange={this.handleChangeSecondary}/>
                    </Segment>
                </Modal.Content>
                <Modal.Actions>
                    <Button color="green" inverted onClick={this.handleStateColors} disabled={loading}>
                        <Icon name="checkmark" /> Save Colors
                    </Button>
                    <Button color="red" inverted onClick={this.closeModal}>
                        <Icon name="remove" /> Cancel
                    </Button>
                </Modal.Actions>
            </Modal>

            </Sidebar>
        )
    }
}

export default connect(null, { setColors })(ColorPanel)
