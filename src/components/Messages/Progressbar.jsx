import React from 'react'
import { Progress } from 'semantic-ui-react'

// statless component
const Progressbar = ({ uploadState, percentUploaded }) => (
        
        uploadState === "uploading" && (
            <Progress 
                className="progress-bar"
                percent={percentUploaded}
                progress
                indicating
                size="medium"
                inverted
            />
        )
    
)

export default Progressbar
