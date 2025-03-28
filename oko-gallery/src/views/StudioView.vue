<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

import { mdiCamera, mdiMagnify, mdiPlusCircle, mdiTwoFactorAuthentication } from '@mdi/js'
import cloneDeep from 'lodash.clonedeep'
import { getChangedFields } from '@/utils/utils.ts'
import {
  AccountAction,
  AccountActionDialog,
  type ChangePasswordPayload,
  type MFAInfo,
  type MFAListInfo,
  MFAMethod, type SessionInfo
} from '@/types/auth.ts'
import type { Level, RenderAs } from 'qrcode.vue'
import QrcodeVue from 'qrcode.vue'
import { HttpStatusCode } from 'axios'
import {
  passwordMinLengthRule,
  requiredRule,
  minLengthRule,
  portfolioLinkRule
} from '@/utils/validation.ts'
import ReauthForm from '@/components/dialogs/ReauthForm.vue'
import { useRouter } from 'vue-router'
import { ensureHttp } from '@/utils/validation.ts'

const valid = ref(false)

const level = ref<Level>('M')
const renderAs = ref<RenderAs>('svg')

// Artwork type
interface Artwork {
  title: string
  description: string
  date: string
  thumbnail: string
  files: {
    painting: string
    study: string
    sketch: string
  }
}

//Router
const router = useRouter()

// Auth store
const authStore = useAuthStore()
let originalUserData = cloneDeep(authStore.user) as Record<string, any>

// Tabs
const tab = ref(1)
const subTab = ref('painting')

const notificationBar = ref({ show: false, timeout: 4000, text: '' })

const accActionDialog = ref({
  show: AccountActionDialog.NULL,
  step: AccountAction.NULL,
  reAuthStep: AccountAction.NULL, //step following reauth
  reauthMode: ref<MFAMethod>(MFAMethod.PASSWORD),
  code: '',
  qrCode: '',
  error: false,
  password: ''
})

function isStep(step: AccountAction) {
  return accActionDialog.value.step === step
}

function useDialog(dialog: AccountActionDialog) {
  return computed({
    get: () => accActionDialog.value.show === dialog,
    set: (val) => {
      if (!val && accActionDialog.value.show === dialog) {
        accActionDialog.value.show = AccountActionDialog.NULL
      }
    }
  })
}

const showChangePasswordDialog = useDialog(AccountActionDialog.CHANGE_PASSWORD)
const showDeleteAccountDialog = useDialog(AccountActionDialog.DELETE_ACCOUNT)
const showMFADialog = useDialog(AccountActionDialog.MFA)
const showLogoutDialog = useDialog(AccountActionDialog.LOGOUT_ALL)

const resetDialog = async (dialog: AccountActionDialog, action: AccountAction, check_totp: boolean = true) => {
  if (check_totp) {
    accActionDialog.value.reauthMode = await authStore.checkTOTP() ? MFAMethod.TOTP : MFAMethod.PASSWORD
  }
  accActionDialog.value.show = dialog
  accActionDialog.value.step = action
  accActionDialog.value.error = false
  accActionDialog.value.password = ''
  accActionDialog.value.code = ''
  changePasswordPayload.value.current_password = ''
  changePasswordPayload.value.new_password = ''
  changePasswordPayload.value.new_password_confirm = ''
  authStore.resetErrors()
}

const openDialog = async (dialog: AccountActionDialog, step: AccountAction) => {
  if (authStore.requiresReAuth()) {
    accActionDialog.value.reAuthStep = step
    await resetDialog(dialog, AccountAction.REAUTH)
  } else {
    await resetDialog(dialog, step)
  }
}

const closeDialog = async () => {
  await resetDialog(AccountActionDialog.NULL, AccountAction.NULL)
}

const changePasswordPayload = ref<ChangePasswordPayload>({
  current_password: '',
  new_password: '',
  new_password_confirm: ''
})

const updateUserAccount = async () => {
  const user = authStore.user as Record<string, any>
  const changedFields = getChangedFields(originalUserData, user)
  await authStore.updateUserAccount(changedFields)
  originalUserData = cloneDeep(authStore.user) as Record<string, any>
  if (authStore.statusCode !== HttpStatusCode.Ok) {
    notificationBar.value.text = 'Error updating account'
    notificationBar.value.show = true
  } else {
    notificationBar.value.text = 'Profile updated successfully!'
    notificationBar.value.show = true
  }
}

const deleteUserAccount = async () => {
  await authStore.deleteUserAccount()
  if (authStore.statusCode === HttpStatusCode.Ok) {
    notificationBar.value.text = 'Account deleted successfully!'
    notificationBar.value.show = true
    await router.push('/')
  }
}

const updateUserPassword = async () => {
  await authStore.changeUserPassword(changePasswordPayload.value)
  if (authStore.statusCode === HttpStatusCode.Ok) {
    await resetDialog(AccountActionDialog.NULL, AccountAction.NULL)
    notificationBar.value.text = 'Password updated successfully!'
  } else if (authStore.statusCode === HttpStatusCode.Unauthorized) {
    await resetDialog(AccountActionDialog.CHANGE_PASSWORD, AccountAction.REAUTH)
  } else {
    accActionDialog.value.error = true
  }
}

const getTOTPSecret = async () => {
  const secret = await authStore.getTOTPSecret()
  if (secret) {
    accActionDialog.value.qrCode = secret.meta.totp_url
  }
}

//REAUTH
const reauthenticateUser = async () => {
  await authStore.reauthenticate(accActionDialog.value.password, accActionDialog.value.reauthMode)
  accActionDialog.value.password = ''
  if (authStore.statusCode === HttpStatusCode.Ok) {
    accActionDialog.value.step = accActionDialog.value.reAuthStep
  } else {
    accActionDialog.value.error = true
  }
}

//MFA
const isMFAMethodActive = (type: string) => {
  const mfas = authStore.twoFAs as MFAListInfo
  return mfas.data.some((mfa) => mfa.type === type && mfa.created_at)
}

const handleTOTPAction = async (method: MFAInfo['data']) => {
  const isMfaActive = isMFAMethodActive(method.type)
  const nextStep = isMfaActive ? AccountAction.MFA_DEACTIVATE : AccountAction.MFA_ACTIVATE
  accActionDialog.value.reAuthStep = nextStep
  if (!isMfaActive) await getTOTPSecret()
  if (authStore.requiresReAuth()) { // if auth_timestamp older than 200 seconds -> request reauth
    accActionDialog.value.step = AccountAction.REAUTH
  } else {
    accActionDialog.value.step = nextStep
  }
}

const handleTOTPAuth = async () => {
  if (isStep(AccountAction.MFA_ACTIVATE)) {
    await authStore.activateTOTPAuthenticator(accActionDialog.value.code)
  } else {
    await authStore.deactivateTOTPAuthenticator()
  }
  if (authStore.statusCode === HttpStatusCode.Ok) {
    await resetDialog(AccountActionDialog.MFA, AccountAction.MFA_INIT)
  } else if (authStore.statusCode === HttpStatusCode.Unauthorized) {
    await resetDialog(AccountActionDialog.MFA, AccountAction.REAUTH)
  } else {
    accActionDialog.value.error = true
  }
}

//LOGOUT SESSIONS
const logoutSession = async (session: SessionInfo['data']) => {
  await authStore.logoutSessions([session])
  if (authStore.statusCode === HttpStatusCode.Unauthorized || session.is_current) {
      await router.push('/')
  } else {
    accActionDialog.value.error = true
  }
}

const handleLogoutSessions = async (session: SessionInfo['data']) => {
  if (authStore.requiresReAuth()) {
    accActionDialog.value.reAuthStep = AccountAction.LOGOUT_ALL
    await resetDialog(AccountActionDialog.LOGOUT_ALL, AccountAction.REAUTH)
  } else {
    await logoutSession(session)
  }
}


const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString()
}

const codeErrorMessages = computed(() =>
  accActionDialog.value.error ? [authStore.errors.code ?? 'Invalid code.'] : []
)
const passwordErrorMessages = computed(() =>
  accActionDialog.value.error ? [authStore.errors.password ?? 'Input error.'] : [])

const clearError = (field: string) => {
  authStore.errors[field] = '' // Remove the error message
  authStore.message = ''
}

const matchPasswordRule =
  () => changePasswordPayload.value.new_password === changePasswordPayload.value.new_password_confirm
    || 'Passwords do not match.'


const selectedArtwork = ref<Artwork | null>(null)
const isUploadingNew = ref(false)

// Filters
const sortBy = ref('date')
const filters = ref({
  style: [] as string[],
  genre: [] as string[],
  media: [] as string[]
})


const searchQuery = ref('')
const styleOptions = ref([]) // load from static file or API
const genreOptions = ref([])
const mediaOptions = ref([])

const filteredArtworks = computed(() => {
  return artworks.value
    .filter(a =>
      a.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    .filter(a =>
      filters.value.style.length === 0 || filters.value.style.includes(a.style)
    )
    .filter(a =>
      filters.value.genre.length === 0 || filters.value.genre.includes(a.genre)
    )
    .filter(a =>
      filters.value.media.length === 0 || filters.value.media.includes(a.media)
    )
    .sort((a, b) => {
      if (sortBy.value === 'title') return a.title.localeCompare(b.title)
      if (sortBy.value === 'date') return new Date(b.date) - new Date(a.date)
      return 0
    })
})

// Artwork mock data
const artworks = ref<Artwork[]>([])

function generateMockArtworks(count: number) {
  const start = artworks.value.length
  for (let i = 0; i < count; i++) {
    artworks.value.push({
      title: `Artwork ${start + i + 1}`,
      description: `Description for artwork ${start + i + 1}`,
      date: new Date().toLocaleDateString(),
      thumbnail: '/favicon.ico',
      files: {
        painting: '/favicon.ico',
        study: '/favicon.ico',
        sketch: '/favicon.ico'
      }
    })
  }
}

onMounted(() => {
  generateMockArtworks(33)
})

const avatarRules = [
  (value: File[] | undefined) => {
    return !value || !value.length || value[0].size < 2000000 || 'Avatar size should be less than 2 MB!'
  }
]

//TODO UPLOAD button inside the v-img
</script>


<template>
  <v-container fluid class="full-screen-container">
    <v-snackbar v-model="notificationBar.show" :timeout="notificationBar.timeout">
      {{ notificationBar.text }}
    </v-snackbar>

    <!-- Delete Account Dialog -->
    <v-dialog v-model="showDeleteAccountDialog" max-width="400" autofocus>
      <v-card>
        <v-card-title>Confirm Account Deletion</v-card-title>
        <v-card-text>
          <div v-if="isStep(AccountAction.REAUTH)">
            <ReauthForm
              v-model="accActionDialog.password"
              @modeChange="accActionDialog.reauthMode = $event"
            />
          </div>
          <div v-else-if="isStep(AccountAction.DELETE_ACCOUNT)">
            You are about to delete your account and all associated data. This action cannot be
            undone.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isStep(AccountAction.REAUTH)" color="green"
                 @click="reauthenticateUser">OK
          </v-btn>
          <v-btn
            v-if="isStep(AccountAction.DELETE_ACCOUNT)"
            color="red"
            variant="outlined"
            @click="deleteUserAccount"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showChangePasswordDialog" max-width="400" autofocus>
      <v-card>
        <v-card-title>CHANGE PASSWORD</v-card-title>
        <v-card-text>
          <div v-if="isStep(AccountAction.REAUTH)">
            <ReauthForm
              v-model="accActionDialog.password"
              @modeChange="accActionDialog.reauthMode = $event"
            />
          </div>
          <v-form v-model="valid" v-else-if="isStep(AccountAction.CHANGE_PASSWORD)">
            <v-text-field
              :rules="[requiredRule]"
              v-model="changePasswordPayload.current_password"
              label="CURRENT PASSWORD"
              type="password"
              density="comfortable"
              autocomplete="password"
              outlined
              required
              :error-messages="authStore.errors.current_password"
              @update:model-value="authStore.resetErrors()"
            />
            <v-text-field
              v-model="changePasswordPayload.new_password"
              label="NEW PASSWORD"
              type="password"
              density="comfortable"
              autocomplete="new-password"
              :rules="[requiredRule, passwordMinLengthRule]"
              outlined
              required
              :error-messages="authStore.errors.new_password"
              @update:model-value="authStore.resetErrors"
            />
            <v-text-field
              v-model="changePasswordPayload.new_password_confirm"
              :rules="[requiredRule, matchPasswordRule]"
              label="CONFIRM PASSWORD"
              type="password"
              density="comfortable"
              autocomplete="new-password"
              outlined
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isStep(AccountAction.REAUTH)" color="green"
                 @click="reauthenticateUser">OK
          </v-btn>
          <v-btn
            v-if="isStep(AccountAction.CHANGE_PASSWORD)"
            color="green"
            variant="outlined"
            :disabled="!valid"
            @click="updateUserPassword">
            Update
          </v-btn>
          <p v-if="authStore.errors.error" class="text-error">{{ authStore.errors.error }}</p>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showMFADialog" max-width="500" autofocus>
      <v-card class="mx-auto"
              min-width="500">
        <v-card-title>Two-Factor Authentication</v-card-title>
        <v-card-text>
          <!-- Step 1: List of methods -->
          <div v-if="isStep(AccountAction.MFA_INIT)">
            <p>Select an authentication method:</p>

            <v-list density="compact" lines="three"
                    style="background-color: #e7e6e6;"
            >
              <v-list-item
                v-for="method in authStore.twoFAs?.data || []"
                :key="method.type"
                class="pa-3"
                style="background-color: #f9f9f9; border-radius: 4px; margin-bottom: 10px;"
              >
                <v-list-item-title class="font-weight-medium">
                  {{ method.type.toUpperCase() }} (Authenticator App)
                </v-list-item-title>

                <v-list-item-subtitle class="text-caption text-grey-darken-1 font-italic mt-1">
                  Created: {{ method.created_at ? formatDate(method.created_at) : 'N/A' }}<br>
                  Last used: {{ method.last_used_at ? formatDate(method.last_used_at) : 'N/A' }}<br>
                  Status: <strong>{{ isMFAMethodActive(method.type) ? 'Active' : 'Inactive'
                  }}</strong>
                </v-list-item-subtitle>
                <template v-slot:append class="mt-4">
                  <v-btn
                    :color="isMFAMethodActive(method.type) ? 'red' : 'green'"
                    variant="outlined"
                    @click="handleTOTPAction(method)"
                  >
                    {{ isMFAMethodActive(method.type) ? 'Deactivate' : 'Activate' }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>
          <div v-else-if="isStep(AccountAction.REAUTH)">
            <ReauthForm
              v-model="accActionDialog.password"
              @modeChange="accActionDialog.reauthMode = $event"
            />
          </div>
          <!-- Step 2: TOTP Activation or Deactivation -->
          <div v-else-if="isStep(AccountAction.MFA_ACTIVATE)">
            <p>
              Scan the QR code with your authenticator app and enter the code below:
            </p>
            <div class="text-center mb-4">
              <qrcode-vue
                :value="accActionDialog.qrCode"
                :level="level"
                :render-as="renderAs"
                :size="200"
              />
              <v-otp-input
                v-model="accActionDialog.code"
                :rules="[requiredRule]"
                :error="accActionDialog.error"
                :length="6" outlined required autofocus
                :error-messages="codeErrorMessages"
                @update:modelValue="accActionDialog.error = false"
              />
            </div>
          </div>
          <div v-else-if="isStep(AccountAction.MFA_DEACTIVATE)" class="text-center">
            <p>You are about to deactivate Two-Factor Authentication.</p>
            <p>Are you sure?</p>
          </div>
          <p v-if="authStore.errors.error"> {{ authStore.errors.error }}</p>

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isStep(AccountAction.REAUTH)" color="green"
                 @click="reauthenticateUser">OK
          </v-btn>
          <v-btn
            v-if="[AccountAction.MFA_ACTIVATE, AccountAction.MFA_DEACTIVATE].includes(accActionDialog.step)"
            :color="isStep(AccountAction.MFA_DEACTIVATE) ? 'red' : 'green'"
            variant="outlined"
            @click="handleTOTPAuth"
          >
            {{ isStep(AccountAction.MFA_DEACTIVATE) ? 'Confirm Deactivation' : 'Activate' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showLogoutDialog" width="600">
      <v-card class="d-flex mx-auto justify-center"
              width="600">
        <v-card-title>DEVICE SESSIONS</v-card-title>
        <v-card-text>
          <!-- Step 1: List of methods -->
          <div v-if="isStep(AccountAction.LOGOUT_ALL)">
            <p>Manage sessions</p>
            <v-list lines="three" style="background-color: #e7e6e6;">
              <v-list-item
                v-for="session in authStore.sessions?.data || []"
                :key="session.id"
                class="pa-3"
                style="background-color: #f9f9f9; border-radius: 4px; margin-bottom: 10px;"
              >
                <v-list-item-content>
                  <v-list-item-title class="font-weight-medium">
                    {{ session.user_agent.substring(0, 50) }} ...
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <v-row no-gutters>
                      <v-col  class="flex-column text-caption text-grey-darken-1 font-italic mt-1">
                        Created: {{ session.created_at ? formatDate(session.created_at) : 'N/A' }}<br />
                        Last used: {{ session.last_used_at ? formatDate(session.last_used_at) : 'N/A' }}<br />
                        IP: {{ session.ip }} |
                        Current: <strong>{{ session.is_current ? 'Yes' : 'No' }}</strong>
                      </v-col>
                      <v-col class="d-flex pa-1  align-end justify-end"
                      >
                        <v-btn
                          color="red"
                          variant="outlined"
                          @click="handleLogoutSessions(session)"
                        >
                          Logout
                        </v-btn>
                      </v-col>
                    </v-row>


                  </v-list-item-subtitle>

                  <!-- Bottom-right button -->

                </v-list-item-content>

              </v-list-item>
            </v-list>

          </div>
          <div v-else-if="isStep(AccountAction.REAUTH)">
            <ReauthForm
              v-model="accActionDialog.password"
              @modeChange="accActionDialog.reauthMode = $event"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isStep(AccountAction.REAUTH)" color="green"
                 @click="reauthenticateUser">OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card class="dashboard-card">
      <!-- Fixed Full-Width Tabs -->
      <v-tabs
        v-model="tab"
        color="black"
        align-tabs="center"
        height="50"
        class="main-tabs"
      >
        <v-tab :value="1">Profile</v-tab>
        <v-tab :value="2">Gallery</v-tab>
      </v-tabs>

      <v-tabs-window v-model="tab" class="tabs-window">
        <v-tabs-window-item :value="1" class="tabs-window-item">
          <div class="tab-scroll-content">
            <v-container class="pa-6" fluid>
              <v-row>
                <v-col cols="12" md="6">
                  <h3> EDIT PROFILE</h3>
                  <v-divider class="mt-1"></v-divider>
                  <v-confirm-edit v-if="authStore.user" ok-text="UPDATE" cancel-text="UNDO"
                                  v-model="authStore.user" @save="updateUserAccount">
                    <template v-slot:default="{ model: proxy, actions }">

                      <div class="d-flex flex-column mt-4" style="align-items:center">
                        <v-card class="pa-4 mb-6">
                          <v-avatar size="200">
                            <img src="/favicon.ico" alt="avatar" class="profile-img"
                                 width="200px" />
                          </v-avatar>
                        </v-card>
                        <v-file-input
                          :rules="avatarRules"
                          accept="image/png, image/jpeg, image/bmp"
                          label=""
                          variant='outlined'
                          class="mt-4 centered-file-input"
                          style="width: 50px;"
                          prepend-icon=""
                          v-model="proxy.value.profile_picture"
                          density="compact"
                        >
                          <template #prepend-inner>
                            <v-icon :icon="mdiCamera"></v-icon>
                          </template>
                        </v-file-input>
                      </div>
                      <v-text-field  density="compact" label="Username"
                                    :model-value="authStore.user.username" disabled />
                      <v-text-field  density="compact" label="Email"
                                    :model-value="authStore.user.email" disabled />
                      <v-text-field  density="compact" label="First Name"
                                    v-model="proxy.value.first_name" :rules="[minLengthRule]" />
                      <v-text-field density="compact" label="Last Name"
                                    v-model="proxy.value.last_name" :rules="[minLengthRule]" />
                      <v-textarea label="Biography"
                                  v-model="proxy.value.biography" />
                      <v-sheet class="country-select-wrapper pa-2 mb-4" style="width: 380px"
                               elevation="1">
                        <country-select
                          v-model="proxy.value.location"
                          :country="proxy.value.location"
                          placeholder="Location"
                          topCountry="DE"
                          countryName
                          class="country-select"
                        />
                      </v-sheet>
                      <v-text-field :rules="[requiredRule, portfolioLinkRule]"
                                    label="Portfolio Link"
                                    v-model="proxy.value.portfolio_link"
                                    @blur="proxy.value.portfolio_link = ensureHttp(proxy.value.portfolio_link)"
                      />
                      <v-switch
                        label="Account Visible"
                        color="black"
                        class=""
                        v-model="proxy.value.is_visible"
                      />
                      <div class="d-flex justify-end gap-1 ">
                        <component :is="actions" variant="outlined"></component>
                      </div>
                    </template>
                  </v-confirm-edit>

                </v-col>

                <v-col cols="12" md="6" class="d-flex flex-column">
                  <div>
                    <h3> PASSWORD & SECURITY</h3>
                    <v-divider class="mt-1"></v-divider>
                    <div>
                      <v-btn color="cyan" variant="outlined" class="mt-3" style="width: 260px"
                             @click="openDialog(AccountActionDialog.MFA, AccountAction.MFA_INIT)">
                        Two-Factor Authentication
                      </v-btn>
                    </div>
                    <div>
                      <v-btn color="#DAA520	" variant="outlined" class="mt-3 self-start"
                             style="width: 260px"
                             @click="openDialog(AccountActionDialog.CHANGE_PASSWORD, AccountAction.CHANGE_PASSWORD)">
                        Change password
                      </v-btn>
                    </div>
                    <div>
                      <v-btn color="black" variant="outlined" class="mt-3 mb-10 self-start"
                             style="width: 260px"
                             @click="() => {
                               authStore.listActiveSessions();
                               openDialog(AccountActionDialog.LOGOUT_ALL, AccountAction.LOGOUT_ALL)
                             }">
                        Logout sessions
                      </v-btn>
                    </div>
                  </div>
                  <div>
                    <h3> MANAGEMENT</h3>
                    <v-divider class="mt-1"></v-divider>
                    <v-btn color="#ff0067" variant="outlined" class="mt-3"
                           style="width: 260px"
                           @click="openDialog(AccountActionDialog.DELETE_ACCOUNT,
                           AccountAction.DELETE_ACCOUNT)">
                      Delete Account
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </div>
        </v-tabs-window-item>

        <!-- GALLERY TAB -->
        <v-tabs-window-item :value="2" class="tabs-window-item">
          <v-container class="pa-4 gallery-container" fluid>
            <v-row>
              <!-- Left: Filter/Sort Panel -->
              <v-col cols="2" class="pr-4">
                <v-card class="pa-4 d-flex flex-column ">
                  <v-select
                    v-model="sortBy"
                    :items="['Date', 'Title']"
                    label="Sort by"
                    variant="outlined"
                    density="compact"
                    class="mb-4"
                  />
                  <v-autocomplete
                    v-model="filters.style"
                    :items="styleOptions"
                    multiple
                    chips
                    closable-chips
                    label="Style"
                    variant="outlined"
                    density="compact"
                    class="mb-4"
                  />

                  <v-autocomplete
                    v-model="filters.genre"
                    :items="genreOptions"
                    multiple
                    chips
                    closable-chips
                    label="Genre"
                    variant="outlined"
                    density="compact"
                    class="mb-4"
                  />

                  <v-autocomplete
                    v-model="filters.media"
                    :items="mediaOptions"
                    multiple
                    chips
                    closable-chips
                    label="Media"
                    variant="outlined"
                    density="compact"
                  />
                </v-card>
              </v-col>

              <!-- Right: Search + Virtual Scroller -->
              <v-col cols="5">
                <v-card class="pa-4 d-flex flex-column " height="74vh">
                  <!-- Search bar -->
                  <v-text-field
                    v-model="searchQuery"
                    label="Search artworks..."
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                  >
                    <template #prepend-inner>
                      <v-icon :icon="mdiMagnify" />
                    </template>
                  </v-text-field>
                  <v-btn icon color="black" @click="isUploadingNew = true; selectedArtwork = null"
                         class="mb-4 mx-auto">
                    <v-icon :icon="mdiPlusCircle"></v-icon>
                  </v-btn>
                  <!-- Virtual scroll list -->
                  <v-virtual-scroll
                    :items="filteredArtworks"
                    item-height="150px"
                    height="calc(100vh - 260px)"
                  >
                    <template #default="{ item, index }">
                      <v-card
                        class="d-flex pa-3 mb-2 align-center"
                        @click="selectedArtwork = item; isUploadingNew = false"
                        elevation="1"
                      >
                        <div class="mr-4 font-weight-bold">{{ index + 1 }}</div>
                        <v-img :src="item.thumbnail" height="80" width="80" class="mr-4 rounded" />
                        <div>
                          <div class="font-weight-medium">{{ item.title }}</div>
                          <div class="text-grey">{{ item.description }}</div>
                          <div class="text-caption text-grey-darken-1 mt-1">
                            Added: {{ item.date }}
                          </div>
                        </div>
                      </v-card>
                    </template>
                  </v-virtual-scroll>
                </v-card>
              </v-col>

              <!-- Right Panel -->
              <v-col cols="5" class="artwork-panel">
                <v-card class="pa-5 d-flex flex-column justify-space-between">
                  <v-tabs v-model="subTab" align-tabs="center" bg-color="grey" height="40">
                    <v-tab value="painting">Painting</v-tab>
                    <v-tab value="study">Study</v-tab>
                    <v-tab value="sketch">Sketch</v-tab>
                  </v-tabs>

                  <!-- Scrollable content below the tabs -->
                  <div class="scroll-area pa-6">
                    <v-tabs-window v-model="subTab" class="mb-4">
                      <v-tabs-window-item value="painting">
                        <v-img :src="selectedArtwork?.files.painting" height="600"
                               class="rounded mb-2" />
                        <div class="mx-auto d-flex justify-center pa-2">
                          <v-btn variant="outlined" color="black" width="180px">Upload / Replace
                          </v-btn>
                        </div>
                      </v-tabs-window-item>
                      <v-tabs-window-item value="study">
                        <v-img :src="selectedArtwork?.files.study" height="600"
                               class="rounded mb-2" />
                        <div class="mx-auto d-flex justify-center pa-2">
                          <v-btn variant="outlined" color="black" width="180px">Upload / Replace
                          </v-btn>
                        </div>
                      </v-tabs-window-item>
                      <v-tabs-window-item value="sketch">
                        <v-img :src="selectedArtwork?.files.sketch" height="600"
                               class="rounded mb-2" />
                        <div class="mx-auto d-flex justify-center pa-2">
                          <v-btn variant="outlined" color="black" width="180px">Upload / Replace
                          </v-btn>
                        </div>

                      </v-tabs-window-item>
                    </v-tabs-window>

                    <v-divider class="my-4" />
                    <v-text-field label="Title" density="compact" variant="outlined" />
                    <v-autocomplete label="Style" :items="[]" variant="outlined"
                                    density="compact" />
                    <v-autocomplete label="Genre" :items="[]" variant="outlined"
                                    density="compact" />
                    <v-autocomplete label="Media" :items="[]" variant="outlined"
                                    density="compact" />
                    <v-date-picker></v-date-picker>
                    <v-textarea label="Description" rows="3" variant="outlined" density="compact" />
                    <v-text-field label="Soundtrack URL" variant="outlined" density="compact" />
                    <v-btn color="black" variant="outlined" class="mt-4">UPDATE</v-btn>
                  </div>
                </v-card>
              </v-col>

            </v-row>
          </v-container>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-container>
</template>

<style scoped>
.full-screen-container {
  z-index: 90;
  height: 85vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: stretch;
}

.dashboard-card {
  width: 100vw;
  height: 83vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-tabs {
  border-bottom: 1px solid #ccc;
  justify-content: center;
}

.tabs-window {
  flex: 1;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  height: 76vh;
}

/* Make window item scrollable internally */
.tabs-window-item {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* Smooth scroll and hidden scrollbar */
  scroll-behavior: smooth;
  -ms-overflow-style: none; /* IE/Edge */
  scrollbar-width: none; /* Firefox */
}

.tabs-window-item::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.country-select-wrapper {
  background-color: white;
  border-radius: 4px;
  border: 1px solid #ccc;
  transition: border-color 0.2s ease;
}

.country-select-wrapper:hover {
  border-color: #1976d2; /* Vuetify primary color */
}

.country-select {
  width: 100%;
  background-color: white;
  border: none;
  outline: none;
  padding: 10px 12px;
  font-size: 16px;
  color: #333;
  appearance: none; /* removes default arrow in some browsers */
}

/* Optional: Custom dropdown arrow */
.country-select::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}


.artwork-panel {
  height: 77vh;
  display: flex;
  flex-direction: column;
}


.scroll-area {
  overflow-y: auto;
  flex: 1;
  max-height: calc(76vh - 48px); /* subtract height of tabs */
}

/* Optional scroll hiding */
.scroll-area::-webkit-scrollbar {
  display: none;
}

.scroll-area {
  -ms-overflow-style: none;
  scrollbar-width: none;
}


.tab-scroll-content {
  flex: 1;
  overflow-y: auto;
  /* Optional: Hide scrollbar on WebKit */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.tab-scroll-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.gallery-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.text-grey {
  color: #888;
}

.filter-row > * {
  min-width: 120px;
}

::-webkit-scrollbar {
  width: 8px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #e1dbdb;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: rgb(164, 164, 164);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.v-list-item:hover {
  background-color: #dcdcdc !important;
}

</style>
