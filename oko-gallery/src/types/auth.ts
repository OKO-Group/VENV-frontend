export interface SignupPayload {
  username: string
  first_name: string
  last_name: string
  email: string
  password: string // Django-Allauth uses password1 and password2 for confirmation
  password_confirmation: string
  portfolio_link: string
  answer: string
}

export interface LoginPayload {
  email: string
  password: string
}

export enum MFAMethod { //TODO include in MFAInfo interface
  TOTP = 'totp',
  PASSWORD = 'password',
}

export enum AccountAction {
  MFA_INIT,
  MFA_ACTIVATE,
  MFA_DEACTIVATE,
  CHANGE_PASSWORD,
  DELETE_ACCOUNT,
  LOGOUT_ALL,
  REAUTH,
  NULL,
}
export enum AccountActionDialog {
  MFA,
  CHANGE_PASSWORD,
  DELETE_ACCOUNT,
  LOGOUT_ALL,
  NULL,
}
export interface ResetPasswordRequestPayload {
  email: string
}

export interface CompletePasswordResetPayload {
  key: string
  password: string
  password_confirmation: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_confirm: string
}

export interface ConfirmEmailPayload {
  key: string
}

export interface ErrorData {
  message: string
  code?: string
  param?: string
}

export interface ErrorResponse {
  status: number
  data: {
    user?: object
    methods?: object[]
    flows: { id: string; providers?: string[]; is_pending?: boolean }[]
  }
  meta?: {
    is_authenticated?: boolean
  }
}

export interface BadRequestResponse {
  status: number
  errors: ErrorData[]
}

export interface GenericError {
  statusCode: number
  errors: Record<string, string>
}

export interface MFAInfo {
  status: number
  data: {
    last_used_at: number | null
    created_at: number | null
    type: string
  }
}

export interface MFAListInfo extends Omit<MFAInfo, 'data'> {
  data: MFAInfo['data'][]
}

export interface SessionInfo {
  status: number
  data: {
    user_agent: string
    ip: string
    created_at: number
    is_current: boolean
    id: number
    last_used_at: number
  }
}
export interface SessionListInfo extends Omit<SessionInfo, 'data'> {
  data: SessionInfo['data'][]
}
export interface TOTPSecret {
  status: number
  meta: {
    secret: string
    totp_url: string
  }
}
