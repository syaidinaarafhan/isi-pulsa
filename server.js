if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JSON_WEB_TOKEN exists:', !!process.env.JSON_WEB_TOKEN);
console.log('CLOUDINARY_URL exists:', !!process.env.CLOUDINARY_URL);


import express from 'express';
import authRouter from './src/auth/auth.controller.js'
import informationRouter from './src/information/info.controller.js';
import transactionRouter from './src/transaction/transaction.controller.js';
import { swaggerMiddleware } from './src/lib/swagger.js';
import passport from 'passport';

const app = express();

const PORT = process.env.PORT || 3010;

app.use(express.json());
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/Swagger', swaggerMiddleware);
app.use('/', authRouter);
app.use('/', informationRouter);
app.use('/', transactionRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}/Swagger`)
    console.log(`Server is running on port http://localhost:${PORT}`);
});
