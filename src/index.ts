import dotenv from 'dotenv';
import Inagawa from './Inagawa';

if (process.env.NODE_ENV !== 'production') dotenv.config();

// eslint-disable-next-line no-new
new Inagawa();
