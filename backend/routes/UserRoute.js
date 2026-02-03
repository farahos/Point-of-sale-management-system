import express from 'express';
import { approveUser, deleteUser, getAllUsers, getSingleUser, inactiveUser, loginUser, registerUser, updateUser } from '../controller/UserController.js';
import { authenticate, authorizeRoles } from '../middleware/authmiddleware.js';


const userRouter = express.Router();
userRouter.post('/registerUser', registerUser);
userRouter.post('/loginUser', loginUser);
userRouter.get('/', getAllUsers);
userRouter.get('/:id', getSingleUser);
// ✅ Admin only - approve user
userRouter.put("/approve/:id", authenticate, approveUser);
userRouter.put("/inactive/:id",authenticate, inactiveUser);
userRouter.put('/:id', authenticate , updateUser);
userRouter.put('/:id', authenticate, authorizeRoles("admin"), deleteUser);

export default userRouter;
