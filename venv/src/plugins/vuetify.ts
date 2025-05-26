import 'vuetify/styles'
import type { ThemeDefinition } from 'vuetify'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { VDateInput } from 'vuetify/labs/components'

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#eeeeee',
    surface: '#FFFFFF',
    primary: '#90CAF9',
    onPrimary: '#000000',
    secondary: '#FFCDD2',
    onSecondary: '#000000',

  },
  variables: {
    'font-family': "'Lato', sans-serif",
  },
}

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#949494',
    primary: '#c49ae3',
    onPrimary: '#000000',
    secondary: '#03DAC6',
    onSecondary: '#000000',
  },
  variables: {
    'font-family': "'Lato', sans-serif",
  },
}

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'darkTheme',
    themes: {
      lightTheme, darkTheme
    },
  },
  defaults: {
    VTextField: {
      variant: 'solo-filled',
      density: 'compact',
    },
    VTextarea: {
      variant: 'solo-filled',
    },
    VAutocomplete: {
      variant: 'solo-filled',
      density: 'compact',
      menuProps: {
        maxWidth: '100%',
        contentClass: 'autocomplete-dropdown',
      },
      style: 'width: 100%',
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  components: {
    VDateInput,
  },
})

export default vuetify
