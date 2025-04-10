import { type AxiosError, HttpStatusCode } from 'axios'
import type { BadRequestResponse, ErrorData, ErrorResponse, GenericError } from '@/types/auth.ts'


export function handleBadRequest(errors: ErrorData[]): Record<string, string> {
  if (errors) {
    // Convert error array into object { field: errorMessage }
    return errors.reduce((acc, err) => {
      acc[err.param || ''] = err.message
      return acc
    }, {} as Record<string, string>)

  } else {
    return { 'error': 'Invalid data. Please check your input.' }
  }
}


type ErrorHandler = (error: AxiosError) => Record<string, string>;

const handleBadRequestError: ErrorHandler = (error) => {
  const err = error as AxiosError<BadRequestResponse>
  return handleBadRequest(err.response?.data.errors ?? [])
}

const handleUnauthorizedError: ErrorHandler = () => ({
  error: 'Unauthorized'
})

const handleGoneError: ErrorHandler = () => ({
  error: 'Resource not found'
})

const handleConflictError: ErrorHandler = () => ({
  error: 'Conflict'
})

const handleDefaultError: ErrorHandler = () => ({
  error: 'An unexpected error occurred.'
})

const errorStrategies: Record<number, ErrorHandler> = {
  [HttpStatusCode.BadRequest]: handleBadRequestError,
  [HttpStatusCode.Unauthorized]: handleUnauthorizedError,
  [HttpStatusCode.Gone]: handleGoneError,
  [HttpStatusCode.Conflict]: handleConflictError
}

export function handleGenericError(axiosError: AxiosError): GenericError {
  const statusCode = axiosError.response?.status ?? 500

  const strategy =
    (statusCode in errorStrategies && errorStrategies[statusCode]) || handleDefaultError

  const errors = axiosError.response
    ? strategy(axiosError)
    : { error: 'Network error. Please try again.' }

  return { statusCode, errors }
}

