import { createContext, useCallback, useEffect, useState } from 'react'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { app } from '../config/firebase'

export const AuthContext = createContext(null)

const auth = getAuth(app)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken()
  }, [])

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logOut = () => signOut(auth)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const value = {
    user,
    loading,
    signIn,
    logOut,
    getIdToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
