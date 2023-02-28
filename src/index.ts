/* eslint-disable no-new */
import dotenv from 'dotenv';
import Inagawa from './Inagawa';

if (process.env.NODE_ENV !== 'production') dotenv.config();

new Inagawa();
