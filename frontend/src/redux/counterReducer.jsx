import React from 'react'
import { useSelector, useDispatch } from 'react-redux';

const initialState = 0;

const counterReducer = (state = initialState, action) => {
  switch (action.type){
    case 'INCREMENT':
        return { count: state.count + 1 }
  }
}

export default counterReducer

const Counter = () => {
    const count = useSelector((state) => state.count);
    const dispatch = useDispatch();
}