import { RequestHandler, Router } from 'express'
import csrf from 'csurf'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'

const csrfProtection: RequestHandler = csrf({
    cookie: true,
}) as unknown as RequestHandler
const customerRouter = Router()

customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), getCustomers)
customerRouter.get('/:id', auth, getCustomerById)
customerRouter.patch('/:id', auth, csrfProtection, updateCustomer)
customerRouter.delete('/:id', auth, deleteCustomer)

export default customerRouter
