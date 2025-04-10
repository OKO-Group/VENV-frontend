import 'vuetify/styles';
import type {ThemeDefinition} from "vuetify";
import {createVuetify} from 'vuetify';
import {aliases, mdi} from 'vuetify/iconsets/mdi-svg'
import { VDateInput } from 'vuetify/labs/components'
const myCustomTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: 'rgba(170,190,204,0.67)', // Change button primary color
    secondary: 'rgba(153,208,197,0.5)',
    accent: '#FFC107',
    success: '#4CAF50',
    warning: '#FB8C00',
    error: '#D32F2F',
    info: '#2196F3',
  },
  variables: {
    "font-family": "'Lato', sans-serif",
  },
};

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'myCustomTheme',
    themes: {
      myCustomTheme,
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
    }
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
});

export default vuetify;
