export interface Handler {
  setNext(handler: Handler): Handler
  handle(): Promise<boolean>
}

export abstract class BaseHandler implements Handler {
  protected nextHandler: Handler | null = null

  setNext(handler: Handler): Handler {
    this.nextHandler = handler
    return handler
  }

  async handle(): Promise<boolean> {
    if (this.nextHandler) return this.nextHandler.handle()
    return true
  }
}

export function useChainRunner(start: Handler) {
  return async () => await start.handle()
}
