import { BaseHandler } from '@/composables/useChainRunner'
import { HttpStatusCode } from 'axios'
import { useAuthStore } from '@/stores/auth.ts'
import { MFAMethod } from '@/types/auth.ts'

const authStore = useAuthStore()

export class ReauthHandler extends BaseHandler {
  constructor(private password: string, private onFail?: () => void) {
    super()
  }

  async handle(): Promise<boolean> {
    await authStore.reauthenticate(this.password, MFAMethod.PASSWORD) //TODO unfinished
    if (authStore.statusCode === HttpStatusCode.Ok) return super.handle()
    this.onFail?.()
    return false
  }
}
