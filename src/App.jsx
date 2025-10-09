import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "@/components/ErrorBoundary"
import { AuthProvider } from "@/shared/auth-context.jsx"

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Pages />
        <Toaster />
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App 