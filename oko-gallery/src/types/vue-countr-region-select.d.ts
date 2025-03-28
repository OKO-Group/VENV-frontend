declare module 'vue3-country-region-select' {
  import { Plugin } from 'vue'
  import type { DefineComponent } from 'vue'

  export const CountrySelect: DefineComponent<{
    country?: string
    countryName?: boolean
    whiteList?: string[]
    blackList?: string[]
    className?: string
    shortCodeDropdown?: boolean
    autocomplete?: boolean
    topCountry?: string
    placeholder?: string
    disablePlaceholder?: boolean
    removePlaceholder?: boolean
    usei18n?: boolean
  }>

  export const RegionSelect: DefineComponent<any> // You can specify full props if needed

  const VueCountryRegionSelect: Plugin & {
    CountrySelect: typeof CountrySelect
    RegionSelect: typeof RegionSelect
  }

  export default VueCountryRegionSelect
}
