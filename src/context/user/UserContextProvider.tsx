import React, { useCallback, useEffect, useRef } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { UserContext, UserContextState } from './context'
import { useRouter } from 'next/router'
import { useAsyncFn } from '@/hooks/useAsyncFn'
import { gql, GraphQLClient, RequestDocument } from 'graphql-request'
import { LoginModal } from '@/components/LoginModal'
import useSWR from 'swr'

const mutation = gql`
	mutation SignUpMutation($address: String!) {
		auth(address: $address) {
			code
			success
			message
			nonce
		}
	}
`

const loginMutation = gql`
	mutation Login($address: String!, $signature: String!) {
		login(address: $address, signature: $signature) {
			code
			success
			message
			user {
				address
				username
				email
				name
				token
				nonce
				id
			}
		}
	}
`
type UserContextProps = {
	children: React.ReactNode
}
const API_ENDPOINT = 'http://localhost:4000/'
const client = new GraphQLClient(API_ENDPOINT)

const fetcher = (query: RequestDocument, variables: any) => {
	return client.request(API_ENDPOINT, query, variables)
}
const query = gql`
	query User($address: String!) {
		user(address: $address) {
			username
			name
			email
			bio
			profileImageUrl
			coverImageUrl
			address
		}
	}
`

export const UserContextProvider = ({ children }: UserContextProps) => {
	const { data, error, mutate, isValidating } = useSWR(query, fetcher)
	const router = useRouter()
	const user = data || null
	const { address, connector: activeConnector, status: accountStatus } = useAccount()
	const { disconnect } = useDisconnect()
	const { status: connectStatus } = useConnect()

	const isLoggingOutRef = useRef(false)
	const isLoggingIn = connectStatus === 'idle' && accountStatus === 'connected' && !user && !isValidating && !isLoggingOutRef.current

	// signout
	const signOut = useCallback(async () => {
		if (isLoggingOutRef.current) {
			return
		}

		// Because logout is async we need to track it in a ref so we don't get caught inbetween
		// state updates where we have a user, but no account data (wallet).
		isLoggingOutRef.current = true

		// Call mutate first. Calls the api and sets the profile to null and false
		await mutate(null, false)

		// Now disconnect
		disconnect()

		try {
			// await post(API_ROUTES.LOGOUT)
		} catch (err) {
			// Don't worry if this throws, most likely a 401
		}
		isLoggingOutRef.current = false
	}, [ disconnect])

	// signin
	const [{ loading: isConnecting }, signIn] = useAsyncFn(async () => {
		if (!activeConnector) {
			return
		}

		// Connect wallet transaction
		try {
			// if there already is a connector, pull from that
			const account = await activeConnector.getAccount()

			// Fetch the nonce from backend
			const {
				auth: { nonce },
			} = await client.request(mutation, { address: account })

			const msg = `I am signing my one-time nonce: ${nonce}`

			const signer = await activeConnector.getSigner()
			const signature = await signer.signMessage(msg.toString())
		
			// Get the JWT token and login by verifying challenge
			const response = await client.request(loginMutation, { address: account, signature })
			console.log(
				'🚀 ~ file: UserContextProvider.tsx ~ line 101 ~ const[{loading:isConnecting},signIn]=useAsyncFn ~ response',
				response
			)
			client.setHeaders({
				authorization: `Bearer ${response.login.user.token}`,
			})
			if (response) {
				// tell SWRs with this bound key to revalidate
				await mutate()
				router.push('/home')
			}
		} catch (err: unknown) {
			console.error(err)
		}
	}, [ router, activeConnector])

	useEffect(() => {
		// Check if the user is connected but not attached to a provider
		// or if the user changed to a different wallet, sign them out.
		if (user?.address && user.address !== address) {
			signOut()
			router.push('/')
		}
	}, [address, user, signOut, router])

	// Set the status
	const status =
		connectStatus === 'loading' || isConnecting
			? 'connecting'
			: connectStatus === 'success'
			? 'connected'
			: 'loading'
			? 'idle'

	const contextValue: UserContextState = React.useMemo(() => {
		return {
			signOut,
			signIn,
			user: error ? null : user,
			status,
		}
	}, [signOut, user, error, signIn, status])

	return (
		<UserContext.Provider value={contextValue}>
			{isLoggingIn && <LoginModal isConnecting={isConnecting} signIn={signIn} signOut={signOut} />}
			{children}
		</UserContext.Provider>
	)
}
