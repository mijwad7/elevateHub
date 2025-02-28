import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createUser } from "../redux/adminSlice";

const CreateUser = () => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({ username: "", password: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(createUser(formData));
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="username" placeholder="Username" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <button type="submit">Create User</button>
        </form>
    );
}

export default CreateUser;