const LOGGING_ENABLED = process.env.NODE_ENV === 'development'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const log = (...args: any[]) => {
  if (LOGGING_ENABLED) {
    console.log(...args)
  }
}