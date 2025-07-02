import { StyleSheet } from 'react-native'
import { ThemeColors } from './hooks/useThemeColors'

export const standardShadow = {
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 }
}

export const standardOutline = (colors: ThemeColors) => ({
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray,
})