import React, { Component } from 'react'
import { Segment, Comment } from 'semantic-ui-react'
import firebase from '../../firebase'
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions'
import MessagesHeader from './MessagesHeader'
import MessageForm from './MessageForm'
import Message from './Message';
import Typing from './Typing';
import Skeleton from './Skeleton'



 class Messages extends Component {

    state = {
      privateChannel: this.props.isPrivateChannel,
      messagesRef: firebase.database().ref('messages'), //triggers when something change in the server
      privateMessagesRef: firebase.database().ref('privateMessages'),
      usersRef: firebase.database().ref('users'),
      typingRef: firebase.database().ref('typing'),
      connectedRef: firebase.database().ref('.info/connected'),
      messages: [],
      messagesLoading: true,
      channel: this.props.currentChannel,
      user: this.props.currentUser,
      numUniqueUsers: '',
      searchTerm: '',
      searchLoading: false,
      searchResult: [],
      isChannelStarred: false,
      typingUsers: []
    }

    componentDidMount() {
        const { channel, user } = this.state
        console.log("channel", channel)
        if(channel && user){
            console.log("channelID", channel.id)
            this.addListeners(channel.id)
            this.addUserStarsListeners(channel.id, user.uid)
        }
    }

    componentWillUnmount(){
        console.log("remove messagesRef")
        this.state.messagesRef.off()
        this.state.privateMessagesRef.off()
    }

    // Scrolls to bottom whenever the states update
    componentDidUpdate(prevProps, prevState){
        if(this.messagesEnd){
            this.scrollToBottom();
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
    }
    

    addListeners = channelId => {
        console.log(channelId)
        this.addMessageListener(channelId)
        this.addTypingListeners(channelId)
    }

    // get all messages from firebase base on ChannelID
    addMessageListener = channelId => {
       
        let loadedMessages = []
        // get the message from firebase and push it on loadedMessages array
        const ref = this.getMessagesRef();
        ref.child(channelId).on('child_added', snap => {
            loadedMessages.push(snap.val())
            this.setState({
                messages: loadedMessages,
                messagesLoading: false
            })
            this.countUniqueUsers(loadedMessages);
            this.countUserPosts(loadedMessages);
            // console.log(loadedMessages)
        })
    }

    addUserStarsListeners = (channelId, userId) => {
        this.state.usersRef
            .child(userId)
            .child('starred')
            .once('value')
            .then(data => {
                if(data.val() != null){
                    // returns an Object of Ids
                    const channelIds = Object.keys(data.val());
                    // returns true if previous Id is equal to current selected channel Id
                    const prevStarred = channelIds.includes(channelId);
                    this.setState({ isChannelStarred: prevStarred })
                }
            })
    }

    addTypingListeners = channelId => {
        // collect all the users
        let typingUsers = [];
        // listens to child added event
        this.state.typingRef.child(channelId).on('child_added', snap => {
            if(snap.key !== this.state.user.uid){
                // add user if user is not current user
                // adds id and name
                typingUsers = typingUsers.concat({
                    id: snap.key,
                    name: snap.val()
                });
                this.setState({ typingUsers: typingUsers });
            }
        });

        this.state.typingRef.child(channelId).on('child_removed', snap => {
            const index = typingUsers.findIndex(user => user.id === snap.key);
            if(index !== -1){
                typingUsers = typingUsers.filter(user => user.id !== snap.key);
                this.setState({ typingUsers: typingUsers })
            }
        });

        this.state.connectedRef.on('value', snap => {
            if(snap.val() === true){
                this.state.typingRef
                    .child(channelId)
                    .child(this.state.user.uid)
                    .onDisconnect()
                    .remove(err => {
                        if(err !== null ){
                            console.error(err)
                        }
                    })
            }
        })
    }

    // Check if privateMessages
    getMessagesRef = () => {
        const { messagesRef, privateMessagesRef, privateChannel } = this.state;
        return privateChannel ? privateMessagesRef : messagesRef;
      };

    /**
     * MessageHeaders Function
     * @param {Array} messages
     * @param {Array} accumulator
     * loops through each messages and find all unique users
     * returns a new array
     * push data if previous(accumulator) does not includes currentValue(message)
     */
    countUniqueUsers = messages => {
        console.log(messages)
       
        const uniqueUser = messages.reduce((accumulator, message) => {
            // console.log(!accumulator.includes(message.user.name));
            // console.log(accumulator)
            if(!accumulator.includes(message.user.name)){
                // console.log(message.user.name)
                accumulator.push(message.user.name);
            }
            return accumulator;
        }, [])
       
        const plural = uniqueUser.length > 1 || uniqueUser.length === 0;
         // return a string if user greater than 1
        const numUniqueUsers = `${uniqueUser.length} user${plural ? 's' : ''}`
        this.setState({ numUniqueUsers: numUniqueUsers });
    }

    countUserPosts = messages => {
        // reduce the array to a single value
        // count the number of user posts
        let userPosts = messages.reduce((acc, message) => {
            // check the array from the start to the end if message.user.name = accumulator
            if(message.user.name in acc){
                // increment when username is seen in the previous value left to right
                acc[message.user.name].count += 1;
            }else{
                acc[message.user.name] = {
                    avatar: message.user.avatar,
                    count: 1
                }
            }
            return acc;
        }, {});
        console.log("userPosts", userPosts)
        this.props.setUserPosts(userPosts);
    }

   
    // get the value from the input tag
    /**
     * @param {event} event
     * SQL"LIKE" operation on firebase is possible
     * let node = await db.ref('yourPath').orderByChild('yourKey {example id:name id is the key}').startAt('!').endAt('SUBSTRING\uf8ff').once('value');
     */
    handleSearchChange = event => {
        this.setState({
            searchTerm: event.target.value,
            searchLoading: true,
            // calls a callback to search the message
        }, () => this.handleSearchMessage())
    }

    handleSearchMessage = () => {
        // get all the message
        const channelMessage = [...this.state.messages];
        // create a regex
        const regex = new RegExp(this.state.searchTerm, 'gi');
        const searchResult = channelMessage.reduce((acc, message) => {
            // check if the content is equals to the searchTerm
            if( 
                (message.content && message.content.match(regex)) || message.user.name.match(regex)
            ){
                acc.push(message)
            }
            return acc;
        }, []);
        // update state searchResult
        this.setState({ searchResult: searchResult })
        // .5 seconds interval
        setTimeout(() => this.setState({ searchLoading: false }), 500)

    }

    displayMessages = messages => (
        messages.length > 0 && messages.map(message => (
            <Message 
                key={message.timestamp}
                message={message}
                user={this.state.user}
            />
        ))
    )
    

    displayChannelName = channel => {
        return channel ? `${this.state.privateChannel  ? '@' : '#'} ${channel.name}` : '';
    }

    
    handleStar = () => {
        // Access previous state
      this.setState(prevState => ({
        isChannelStarred: !prevState.isChannelStarred
      }), () => this.starChannel());
    }

    starChannel = () => {
        if(this.state.isChannelStarred){
            // create another document for users
            this.state.usersRef.child(`${this.state.user.uid}/starred`)
            .update({
                [this.state.channel.id]: {
                    name: this.state.channel.name,
                    details: this.state.channel.details,
                    createdBy: {
                        name: this.state.channel.createdBy.name,
                        avatar: this.state.channel.createdBy.avatar
                    }
                }
            })
            console.log('star')
        }else{
            this.state.usersRef
                .child(`${this.state.user.uid}/starred`)
                .child(this.state.channel.id)
                .remove(err => {
                    if(err !== null){
                        console.error(err);
                    }
                })
            console.log('unstar')
        }
    }

    /**
     * @param {Array} users
     * @summary Display if the user is typing
     */
    displayTypingUsers = users => (
        users.length > 0 && users.map(user => (
            <div style={{ display: "flex", alignItems: 'center', marginBottom: '0.2em' }} key={user.id}>
                <span className="user-typing">{user.name} is typing</span> <Typing />
            </div>
        ))
    )

    displayMessageSkeleton = loading => (
        loading ? (
            <React.Fragment>
                {[...Array(10)].map((_, index) => (
                    <Skeleton key={index}/>
                ))}
            </React.Fragment>
        ) : null
    )

    render() {
        
        const { messagesRef, messages ,channel, user, numUniqueUsers, searchTerm, searchResult, searchLoading, privateChannel, isChannelStarred, typingUsers, messagesLoading } = this.state;

        return (
          <React.Fragment>
              <MessagesHeader 
                channelName = {this.displayChannelName(channel)}
                numUniqueUsers = { numUniqueUsers }
                handleSearchChange ={ this.handleSearchChange }
                searchLoading = {searchLoading}
                isPrivateChannel={privateChannel}
                handleStar={this.handleStar}
                isChannelStarred={isChannelStarred}
              />

              <Segment>
                  <Comment.Group className="messages">
                    {this.displayMessageSkeleton(messagesLoading)}
                      {/* Check if there is a searchTerm */}
                    {searchTerm ? this.displayMessages(searchResult) : this.displayMessages(messages)}
                    {this.displayTypingUsers(typingUsers)}
                    <div ref={node => (this.messagesEnd = node)}></div>
                  </Comment.Group>
              </Segment>

              <MessageForm 
                messagesRef={messagesRef} 
                currentChannel={channel}
                currentUser={user}
                isPrivateChannel={privateChannel}
                getMessagesRef={this.getMessagesRef}
                />
          </React.Fragment>
        )
    }
}

export default connect(null, { setUserPosts })(Messages)
