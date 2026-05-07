import { IOrder, IOrderResult } from '../../../utils/types'
import { createAsyncThunk } from '../../hooks'

export const createOrder = createAsyncThunk<
    IOrderResult,
    { orderData: IOrder; csrf: string }
>('order/createOrder', ({ orderData, csrf }, { extra: { createOrder } }) => {
    return createOrder(orderData, csrf)
})
