import xss from 'xss'
import { Request, Response, NextFunction } from 'express'
import BadRequestError from '../errors/bad-request-error'

const hasMongoOperator = (obj: Record<string, unknown>): boolean => Object.keys(obj).some(key => key.startsWith('$'))

const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {}
    if (hasMongoOperator(obj))
        throw new BadRequestError('Недопустимый оператор в поле запроса')
    
    Object.keys(obj).forEach(key => {
        const value = obj[key]
        if (typeof value === 'string') sanitized[key] = xss(value)
            
        else if (Array.isArray(value))
            sanitized[key] = value.map(item => {
                if (typeof item === 'string') return xss(item)
                if (typeof item === 'object') return sanitize(item)
                return item
            })
            
        else if (typeof value === 'object' && value !== null)
            sanitized[key] = sanitize(value as Record<string, unknown>)
        
        else sanitized[key] = value
    })
    return sanitized
}

const sanitizeMiddleware = (fields: string[]) => (req: Request, res: Response, next: NextFunction) => {
    try {
        if (fields.includes('body') || fields.length === 0)
            if (req.body && typeof req.body === 'object')
                req.body = sanitize(req.body)
        
        if (fields.includes('query') || fields.length === 0)
            if (req.query && typeof req.query === 'object')
                req.query = sanitize(
                    req.query as Record<string, unknown>
                ) as typeof req.query
        
        next()
    } catch (error) {
        next(error)
    }
}

const sanitizeBody = sanitizeMiddleware(['body'])
const sanitizeQuery = sanitizeMiddleware(['query'])
const sanitizeAll = sanitizeMiddleware([])

export { sanitizeMiddleware, sanitizeBody, sanitizeQuery, sanitizeAll }
export default sanitizeMiddleware
