// Next.js 16 ships native ESLint flat-config arrays — spread them directly
// (no FlatCompat needed).
import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**"],
  },
]

export default eslintConfig
