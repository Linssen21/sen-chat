import React from 'react'
import { Comment, Image } from 'semantic-ui-react'
import moment from 'moment';

// Determine the user based on the message
const isOwnMessage = (message, user) => {
    return message.user.id === user.uid ? 'message-self' : ''
}

const isImage = (message) => {
    return message.hasOwnProperty('image') && !message.hasOwnProperty('content')
}

const timefromNow = timestamp => moment(timestamp).fromNow();


const Message = ({ message, user }) => (
   <Comment>
       <Comment.Avatar src={message.user.avatar}/>
       <Comment.Content className={isOwnMessage(message, user)}>
           <Comment.Author as="a">{ message.user.name }</Comment.Author>
           <Comment.Metadata>{ timefromNow(message.timestamp) }</Comment.Metadata>
          
           {/* Check if theres an image */}
           {isImage(message) ? <Image src={message.image} className="message-image" /> : 
         <Comment.Text>{ message.content }</Comment.Text>}
        </Comment.Content>
   </Comment>
);

export default Message