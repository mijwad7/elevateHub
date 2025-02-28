import React from 'react'
import { Link } from 'react-router-dom'

const NotAuthorized = () => {
  return (
    <div>
        <h1>You are not authorized to view this page</h1>
        <Link to="/"><p>Return to Home</p></Link>
    </div>
  )
}

export default NotAuthorized