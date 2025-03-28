import { defineStore } from 'pinia'
import api from '@/api/api'
import {
  type BadRequestResponse,
  type ChangePasswordPayload,
  type CompletePasswordResetPayload,
  type ConfirmEmailPayload,
  type ErrorResponse,
  type LoginPayload,
  type MFAInfo,
  type MFAListInfo,
  MFAMethod,
  type ResetPasswordRequestPayload, type SessionInfo, type SessionListInfo,
  type SignupPayload,
  type TOTPSecret
} from '@/types/auth.ts'
import { AxiosError, type AxiosResponse, HttpStatusCode } from 'axios'
import { handleBadRequest, handleGenericError } from '@/utils/requests.ts'
import type { User } from '@/types/oko.ts'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    id: null as number | null,
    user: null as User | null,
    loading: false,
    errors: {} as Record<string, string>, // Stores field-specific errors
    message: null as string | null, // Stores message (info)
    statusCode: null as number | null, // Store response status code
    twoFAs: null as MFAListInfo | null,
    sessions: null as SessionListInfo | null,
    totp: null as MFAInfo | null,
    authTimestamp: null as number | null
  }),
  persist: {
    pick: ['id']
  },
  getters: {
    hasTOTP: (state) => {
      if (!state.twoFAs) return false
      const mfa = state.twoFAs as MFAListInfo
      return mfa?.data?.some((m) => m.type === 'totp' && m.created_at)
    }
  },
  actions: {
    resetErrors() {
      this.errors = {}
      this.message = null
      this.statusCode = null
    },
    async checkTOTP() {
      await this.listTwoFactorAuthenticators()
      return this.hasTOTP
    },
    requiresReAuth(): boolean {
      return this.authTimestamp == null || ((new Date().getTime() / 1000) - this.authTimestamp > 200)
    },
    async isAuthenticated() {
      try {
        const response = await api.get('users/_allauth/browser/v1/auth/session')
        this.authTimestamp = response.data.data.methods.pop().at
      } catch (error) {
        console.log('Authentication check failed.')
        return false
      }
      if (this.user === null) {
        await this.fetchUser()
      }
      return true
    },

    async fetchUser() {
      try {
        this.loading = true
        const response = await api.get<User>(`users/artist/${this.id}/`)
        this.user = response.data
      } catch (error) {
        this.user = null //Unexpected error
      } finally {
        this.loading = false
      }
    },

    async login(credentials: LoginPayload) {
      this.resetErrors()
      try {
        this.loading = true
        const response = await api.post('users/_allauth/browser/v1/auth/login', credentials)
        this.id = response.data.data.user.id //TODO adjust allauth to send all user data to remove fetchUser()
        this.authTimestamp = response.data.data.methods.pop().at
        await this.fetchUser()
      } catch (error) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          this.statusCode = axiosError.response.status
          switch (axiosError.response.status) {
            case HttpStatusCode.Unauthorized: {
              const err = axiosError.response as AxiosResponse<ErrorResponse>
              for (let flow of err.data.data.flows) {
                if (flow.id === 'verify_email') {
                  this.statusCode = HttpStatusCode.Forbidden
                  this.errors = { 'error': 'Pending email verification' }
                  return
                } else if (flow.id === 'mfa_authenticate') {
                  this.statusCode = HttpStatusCode.Accepted
                  return
                }
              }
              this.errors = { 'error': 'Invalid credentials.' }
              break
            }
            case HttpStatusCode.Forbidden: {
              this.errors = { 'error': 'Account pending approval' }
              break
            }
            case HttpStatusCode.BadRequest: {
              const err = axiosError.response as AxiosResponse<BadRequestResponse>
              this.errors = { 'error': err.data.errors[0].message }
              break
            }
            default: {
              this.errors = { 'error': 'Invalid credentials.' }
            }
          }
        } else {
          this.errors = { 'error': 'An unknown server error occurred,' }
          this.statusCode = HttpStatusCode.InternalServerError
        }
      } finally {
        this.loading = false
      }
    },

    async loginMFA(code: string) {
      this.resetErrors()
      try {
        const response = await api.post('users/_allauth/browser/v1/auth/2fa/authenticate', { code })
        this.statusCode = response.status
        this.authTimestamp = response.data.data.methods.pop().at
        this.errors = {}
        await this.fetchUser()
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    },
    async reauthenticate(password: string, method: MFAMethod) {
      this.resetErrors()
      try {
        let response
        if (method === MFAMethod.PASSWORD) {
          response = await api.post('users/_allauth/browser/v1/auth/reauthenticate', { password })
        } else {
          response = await api.post('users/_allauth/browser/v1/auth/2fa/reauthenticate', { code: password })
        }
        this.statusCode = response.status
        this.authTimestamp = response.data.data.methods.pop().at

        this.errors = {}
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    },

    async logout() {
      this.resetErrors()
      try { //TODO complete this logic
        const response = await api.delete('users/_allauth/browser/v1/auth/session')
        this.statusCode = response.status
      } catch (error) {
      }
      this.user = null
    },

    async logoutSessions(sessions: SessionInfo['data'][]) {
      this.resetErrors()
      try {
        const response = await api.delete('users/_allauth/browser/v1/auth/sessions',
          { data: {sessions: sessions.map(s => s.id)} })
        if (sessions.some(s => s.is_current)) {
          this.$reset()
        }
        this.statusCode = response.status
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
      await this.listActiveSessions()
    },

    async signup(userData: SignupPayload) {
      this.resetErrors()
      try {
        this.loading = true
        const response = await api.post('users/_allauth/browser/v1/auth/signup', userData)
        this.statusCode = response.status
      } catch (error) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          this.statusCode = axiosError.response.status
          switch (axiosError.response.status) {
            case HttpStatusCode.BadRequest:
              const err = axiosError.response as AxiosResponse<BadRequestResponse>
              this.errors = handleBadRequest(err.data.errors)
              break
            case HttpStatusCode.Unauthorized: //expected
              this.message = 'Signup successful. Please confirm your email. Your account is pending approval.'
              break
            default:
              this.errors = { 'error': 'An unexpected error occurred.' }
          }
        } else {
          this.errors = { 'error': 'Network error. Please try again.' }
        }
      } finally {
        this.loading = false
      }
    },

    async requestPasswordReset(credentials: ResetPasswordRequestPayload) {
      this.resetErrors()

      try {
        const response = await api.post('users/_allauth/browser/v1/auth/password/request', credentials)
        this.statusCode = response.status
      } catch (error) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          switch (axiosError.response.status) {
            case HttpStatusCode.BadRequest: {
              const err = axiosError.response as AxiosResponse<BadRequestResponse>
              this.errors = { 'error': err.data.errors[0].message }
              break
            }
            case HttpStatusCode.Unauthorized: {
              this.errors = { 'error': 'Unauthorized' } //TODO check this
              break
            }
          }
        } else {
          this.errors = { 'error': 'An unknown server error occurred.' }
        }
      }
    },
    async getPasswordResetInfo(key: string) {
      this.resetErrors()
      try {
        const response = await api.get(`users/_allauth/browser/v1/auth/password/reset`, {
          headers: { 'X-Password-Reset-Key': key }
        })
        this.statusCode = response.status
      } catch (error) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          switch (axiosError.response.status) {
            case HttpStatusCode.BadRequest: {
              const err = axiosError.response as AxiosResponse<BadRequestResponse>
              this.errors = { 'error': err.data.errors[0].message }
              break
            }
            case HttpStatusCode.Conflict: {
              this.errors = { 'error': 'No password reset flow pending.' }
              break
            }
          }
        } else {
          this.errors = { 'error': 'An unknown server error occurred.' }
        }
      }
    },
    async completePasswordRequest(credentials: CompletePasswordResetPayload) {
      this.resetErrors()
      try {
        const response = await api.post('users/_allauth/browser/v1/auth/password/reset', credentials)
        this.statusCode = response.status
        this.id = response.data.data.user.id
        await this.fetchUser()
      } catch (error) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          switch (axiosError.response.status) {
            case HttpStatusCode.BadRequest: {
              const err = axiosError.response as AxiosResponse<BadRequestResponse>
              this.errors = { 'error': err.data.errors[0].message }
              break
            }
            case HttpStatusCode.Unauthorized: {
              break
            }
            case HttpStatusCode.Conflict: {
              this.errors = { 'error': 'Invalid password reset code or reset not pending.' }
              break
            }
          }
        } else {
          this.errors = { 'error': 'An unknown server error occurred.' }
        }
      }
    },
    async verifyEmail(credentials: ConfirmEmailPayload) {

      try {
        const response = await api.post(`users/_allauth/browser/v1/auth/email/verify`, credentials)
        this.statusCode = response.status
      } catch (error) {
        const axiosError = error as AxiosError
        this.statusCode = axiosError.response?.status ?? 500
        if (axiosError.response) {
          switch (axiosError.response.status) {
            case HttpStatusCode.Unauthorized: { //expected
              this.message = 'Email verified successfully.'
              break
            }
            case HttpStatusCode.BadRequest: {
              const err = axiosError.response as AxiosResponse<BadRequestResponse>
              this.errors = { 'error': err.data.errors[0].message }
              break
            }
            case HttpStatusCode.Conflict: {
              this.errors = { 'error': 'No email verification  pending.' }
              break
            }
          }
        } else {
          this.statusCode = 500
          this.errors = { 'error': 'An unknown server error occurred.' }
        }
      }
    },
    async updateUserAccount(data: Record<string, any>) {
      this.resetErrors()
      try {
        const response = await api.patch(`users/artist/${this.id}/`, data) //TODO backend Location check for naughty users
        this.statusCode = response.status
        this.user = response.data
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
      await this.fetchUser()
    },
    async changeUserPassword(data: ChangePasswordPayload) {
      this.resetErrors()
      try {
        const response = await api.post(`users/_allauth/browser/v1/account/password/change`, data)
        this.statusCode = response.status
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    },
    async deleteUserAccount() {
      this.resetErrors()
      try {
        const response = await api.delete(`users/artist/${this.id}/`)
        this.$reset()
        this.statusCode = response.status
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    },
    async listTwoFactorAuthenticators() {
      this.resetErrors()
      try {
        const response: AxiosResponse<MFAListInfo> = await api.get(`users/_allauth/browser/v1/account/authenticators`)
        this.statusCode = response.status
        this.twoFAs = response.data
        // populate twoFAs with available options if not active (absent)
        const available_methods = [
          { type: 'totp', last_used_at: null, created_at: null }
        ]
        for (const method of available_methods) {
          if (!this.twoFAs.data.find(totp => totp.type === method.type)) {
            this.twoFAs.data.push(method)
          }
        }
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    },
    async listActiveSessions() {
      this.resetErrors()
      try {
        const response: AxiosResponse<SessionListInfo> = await api.get(`users/_allauth/browser/v1/auth/sessions`)
        this.statusCode = response.status
        this.sessions = response.data
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    },
    async getTOTPSecret() {
      this.resetErrors()

      try {
        await api.get(`users/_allauth/browser/v1/account/authenticators/totp`)
        return null //TOTP 2FA already enabled
      } catch (error) {
        const axiosError = error as AxiosError<TOTPSecret>
        if (axiosError.response) {
          this.statusCode = axiosError.response.status
          if (axiosError.response.status == HttpStatusCode.NotFound) {
            return axiosError.response.data
          }
        }
      }
      return null
    },
    async activateTOTPAuthenticator(code: string) {
      this.resetErrors()
      try {
        const response: AxiosResponse<MFAInfo> = await api.post(`users/_allauth/browser/v1/account/authenticators/totp`, { code })
        this.statusCode = response.status
        this.totp = response.data
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    },

    async deactivateTOTPAuthenticator() {
      this.resetErrors()
      try {
        const response = await api.delete(`users/_allauth/browser/v1/account/authenticators/totp`)
        this.statusCode = response.status
        this.totp = null
      } catch (error) {
        const { statusCode, errors } = handleGenericError(error as AxiosError)
        this.statusCode = statusCode
        this.errors = errors
      }
    }
  }

})
