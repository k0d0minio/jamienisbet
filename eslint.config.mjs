// Next.js 16 ships native ESLint flat-config arrays — spread them directly
// (no FlatCompat needed).
import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    // The app is linted. The work layer's scripts and the static brand helper
    // (assets/lib/icons.js, a UMD file for plain HTML) are not app code.
    ignores: [".next/**", "node_modules/**", ".icm/**", ".claude/**", "assets/**"],
  },
]

export default eslintConfig
