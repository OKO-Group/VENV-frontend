import { BaseHandler } from '@/composables/useChainRunner'
import { HttpStatusCode } from 'axios'
import { useAuthStore } from '@/stores/auth.ts'

const authStore = useAuthStore()
export class TotpHandler extends BaseHandler {
  constructor(private code: string, private onFail?: () => void) {
    super()
  }

  async handle(): Promise<boolean> {
    await authStore.activateTOTPAuthenticator(this.code)
    if (authStore.statusCode === HttpStatusCode.Ok) return super.handle()
    this.onFail?.()
    return false
  }
}

