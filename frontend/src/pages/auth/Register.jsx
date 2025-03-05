import React from 'react'
import Form from '../../components/Form'
import Navbar from '../../components/Navbar'

const Register = () => {
  return (
    <>
    <Navbar />
    <Form route="api/user/register/" method="register" />
    </>
  )
}

export default Register