import {
  type Auth,
  type User,
  type UserCredential,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useFirebaseAuth } from 'vuefire'

export const useFirebaseAuthStore = defineStore('firebaseAuth', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUser = ref<User | null>(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value)
  const userEmail = computed(() => currentUser.value?.email)
  const userId = computed(() => currentUser.value?.uid)

  // Get auth from VueFire and listen for auth state changes
  const auth = useFirebaseAuth()
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      currentUser.value = user
      isInitialized.value = true
    })
  } else {
    error.value = 'Firebase Auth not available from VueFire'
  }

  const executeAuthAction = async <T>(
    action: (auth: Auth) => Promise<T>
  ): Promise<T> => {
    if (!auth) throw new Error('Firebase Auth not initialized')

    loading.value = true
    error.value = null

    try {
      return await action(auth)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      throw e
    } finally {
      loading.value = false
    }
  }

  const login = async (
    email: string,
    password: string
  ): Promise<UserCredential> =>
    executeAuthAction((authInstance) =>
      signInWithEmailAndPassword(authInstance, email, password)
    )

  const register = async (
    email: string,
    password: string
  ): Promise<UserCredential> =>
    executeAuthAction((authInstance) =>
      createUserWithEmailAndPassword(authInstance, email, password)
    )

  const logout = async (): Promise<void> =>
    executeAuthAction((authInstance) => signOut(authInstance))

  const getIdToken = async (): Promise<string | null> => {
    if (currentUser.value) {
      return currentUser.value.getIdToken()
    }
    return null
  }

  return {
    // State
    loading,
    error,
    currentUser,
    isInitialized,

    // Getters
    isAuthenticated,
    userEmail,
    userId,

    // Actions
    login,
    register,
    logout,
    getIdToken
  }
})
