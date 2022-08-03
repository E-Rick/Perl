import React from 'react'

export interface UserProfile {
	address: string
	id: number
	username?: string
	profileImageUrl?: string
	token: string
	nonce: number
}

export interface UserContextState {
	user: UserProfile | null
	status: 'loading' | 'connecting' | 'connected' | 'idle'
	signIn: () => Promise<void>
	signOut: () => Promise<void>
}

export const UserContext = React.createContext<UserContextState>({
	user: null,
	status: 'loading',
	signOut: async () => {},
	signIn: async () => undefined,
})

export const useUser = () => React.useContext(UserContext)
