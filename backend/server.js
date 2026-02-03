import express from 'express';
import { connect } from 'mongoose';
import conectBD from './config/db.js';
import { registerUser } from './controller/UserController.js';
import userRouter from './routes/UserRoute.js';

import cookieParser from 'cookie-parser';
import TokenRoute from './routes/TokenRoute.js';
import CustomerRoutes from './routes/CustomerRoutes.js'
import ProductRoutes from './routes/ProductRoutes.js'
import SalesRoutes from  './routes/SalesRoutes.js'


import cors from 'cors';

const app = express();
const PORT = 8000

// ✅ CORS FIRST (MUHIIM)
app.use(cors({
  origin: 'https://inventory-management-system-1mcj.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/user', userRouter);

app.use("/api/customers", CustomerRoutes);
app.use("/api/Products", ProductRoutes);
app.use("/api/sales", SalesRoutes);




// forget password
app.use('/api/forgetpassword', TokenRoute);


conectBD();
app.listen(PORT ,()=>{
    console.log(`Server is running on port ${PORT}`);

})
